'use client'

import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Star, MapPin, DollarSign, CheckCircle, MessageSquare, Clock, Filter, UserCheck, Briefcase, ChevronRight, PlusCircle, Sparkles } from 'lucide-react'
import LanguageToggle from '@/components/LanguageToggle'

interface WorkerWithProfile {
    user_id: string
    skills: string[]
    experience: number
    wage_expectation: number
    location: string
    total_jobs: number
    profiles: {
        id: string
        name: string
        rating: number
        verified: boolean
        aadhaar_verified: boolean
    }
}

interface Conversation {
    id: string
    worker_id: string
    status: string
    created_at: string
    worker: {
        name: string
        rating: number
        aadhaar_verified: boolean
    }
}

export default function EmployerDashboard() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const tab = searchParams.get('tab') || 'search'
    const supabase = createClientComponentClient()

    useEffect(() => {
        if (!authLoading && profile === null) {
            return
        }
        if (!authLoading && profile && profile.role !== 'employer') {
            router.push('/worker/dashboard')
        }
    }, [profile, authLoading, router])

    const [workers, setWorkers] = useState<WorkerWithProfile[]>([])
    const [activeHires, setActiveHires] = useState<Conversation[]>([])
    const [completedHires, setCompletedHires] = useState<Conversation[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [minWage, setMinWage] = useState('')
    const [maxWage, setMaxWage] = useState('')
    const [minRating, setMinRating] = useState('')
    const [loadingWorkers, setLoadingWorkers] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [selecting, setSelecting] = useState<string | null>(null)

    // Job Posting State
    const [jobTitle, setJobTitle] = useState('')
    const [jobDesc, setJobDesc] = useState('')
    const [jobWage, setJobWage] = useState('')
    const [jobLocation, setJobLocation] = useState('')
    const [jobSkills, setJobSkills] = useState<string[]>([])
    const [isPosting, setIsPosting] = useState(false)
    const [isExtracting, setIsExtracting] = useState(false)
    const [postMsg, setPostMsg] = useState('')

    const handleAIAutofill = async () => {
        if (!jobDesc.trim()) {
            setPostMsg('Please write a job description first.')
            return
        }
        setIsExtracting(true)
        setPostMsg('')
        try {
            const res = await fetch('/api/skill-extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: jobDesc })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            if (data.suggestedWage) setJobWage(data.suggestedWage.toString())
            if (data.skills && Array.isArray(data.skills)) setJobSkills(data.skills)
            setPostMsg('AI populated suggested wage and skills!')
        } catch (err: any) {
            console.error('AI Extraction Error:', err)
            setPostMsg('Failed to extract data using AI.')
        } finally {
            setIsExtracting(false)
        }
    }

    const handlePostJob = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || isPosting) return

        setIsPosting(true)
        setPostMsg('')

        try {
            // 0. Generate Semantic Embedding for the Job
            let jobEmbedding = null
            try {
                const embedStr = `${jobTitle} ${jobDesc} ${jobSkills.join(' ')}`
                const embedRes = await fetch('/api/embeddings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: embedStr })
                })
                if (embedRes.ok) {
                    const embedData = await embedRes.json()
                    if (embedData.embedding) {
                        jobEmbedding = embedData.embedding
                    }
                }
            } catch (embedErr) {
                console.error('Non-fatal embedding err:', embedErr)
            }

            // 1. Save to Supabase
            const { data: newJob, error } = await supabase.from('jobs').insert({
                employer_id: user.id,
                title: jobTitle,
                description: jobDesc,
                skill_tags: jobSkills,
                wage: Number(jobWage),
                location_text: jobLocation,
                status: 'open',
                embedding: jobEmbedding
            }).select('id').single()

            if (error) throw error

            // 2. Trigger n8n Webhook for Push Notification
            // TODO: Replace this URL with the actual n8n production webhook URL
            const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/job-created'

            try {
                // Fire and forget webhook
                fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        job_id: newJob.id,
                        title: jobTitle,
                        location: jobLocation,
                        wage: jobWage
                    })
                }).catch(err => console.error('Webhook failed (non-fatal):', err))
            } catch (webhookErr) {
                console.error('Webhook trigger error:', webhookErr)
            }

            setPostMsg('Job posted successfully! Workers have been notified.')
            setJobTitle('')
            setJobDesc('')
            setJobWage('')
            setJobLocation('')
            setJobSkills([])
        } catch (err: any) {
            console.error('Error posting job:', err)
            setPostMsg(err.message || 'Error posting job')
        } finally {
            setIsPosting(false)
        }
    }

    const fetchWorkers = useCallback(async () => {
        setLoadingWorkers(true)
        let filtered: WorkerWithProfile[] = []

        try {
            if (searchQuery) {
                // Try semantic search first
                try {
                    const embedRes = await fetch('/api/embeddings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: searchQuery })
                    })
                    if (embedRes.ok) {
                        const { embedding } = await embedRes.json()
                        if (embedding) {
                            const { data: matches, error: rpcError } = await supabase.rpc('match_workers', {
                                job_embedding: embedding,
                                match_threshold: 0.2, // loose match threshold
                                match_count: 50
                            })
                            if (!rpcError && matches && matches.length > 0) {
                                const workerIds = matches.map((m: any) => m.worker_id)
                                const { data: matchedProfiles } = await supabase
                                    .from('worker_profiles')
                                    .select('*, profiles!inner(id, name, rating, verified, aadhaar_verified)')
                                    .in('user_id', workerIds)

                                if (matchedProfiles) {
                                    filtered = matchedProfiles as unknown as WorkerWithProfile[]
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error("Semantic search failed, falling back to basic search", err)
                }
            }

            // Fallback to basic search if semantic didn't yield anything
            if (filtered.length === 0) {
                let query = supabase
                    .from('worker_profiles')
                    .select('*, profiles!inner(id, name, rating, verified, aadhaar_verified)')

                if (searchQuery) {
                    query = query.or(`location.ilike.%${searchQuery}%,skills.cs.{${searchQuery}}`, { referencedTable: undefined })
                }
                const { data } = await query
                filtered = (data || []) as unknown as WorkerWithProfile[]
            }

            // Apply filters
            if (minWage) filtered = filtered.filter(w => w.wage_expectation >= Number(minWage))
            if (maxWage) filtered = filtered.filter(w => w.wage_expectation <= Number(maxWage))
            if (minRating) filtered = filtered.filter(w => w.profiles.rating >= Number(minRating))

            setWorkers(filtered)
        } catch (err) {
            console.error('Fetch workers error:', err)
        } finally {
            setLoadingWorkers(false)
        }
    }, [supabase, searchQuery, minWage, maxWage, minRating])

    const fetchConversations = useCallback(async () => {
        if (!user) return

        // Single query for all non-pending conversations
        const { data: allConvs } = await supabase
            .from('conversations')
            .select('id, worker_id, status, created_at')
            .eq('employer_id', user.id)
            .in('status', ['hired', 'completed'])

        const convs = allConvs || []
        const workerIds = [...new Set(convs.map(c => c.worker_id))]
        let workerMap: Record<string, { name: string; rating: number; aadhaar_verified: boolean }> = {}

        if (workerIds.length > 0) {
            const { data: workers } = await supabase.from('profiles').select('id, name, rating, aadhaar_verified').in('id', workerIds)
            workerMap = Object.fromEntries((workers || []).map(w => [w.id, { name: w.name, rating: w.rating || 0, aadhaar_verified: w.aadhaar_verified || false }]))
        }

        const enriched = convs.map(conv => ({
            ...conv,
            worker: workerMap[conv.worker_id] || { name: 'Unknown', rating: 0, aadhaar_verified: false }
        }))

        setActiveHires(enriched.filter(c => c.status === 'hired'))
        setCompletedHires(enriched.filter(c => c.status === 'completed'))
    }, [user])

    useEffect(() => {
        fetchWorkers()
    }, [fetchWorkers])

    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    const handleSelectWorker = async (workerId: string) => {
        if (!user) return
        setSelecting(workerId)

        // Check if conversation already exists
        const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .eq('employer_id', user.id)
            .eq('worker_id', workerId)
            .neq('status', 'completed')
            .limit(1).single()

        if (existing) {
            router.push(`/conversation/${existing.id}`)
            return
        }

        // Create new conversation
        const { data: conv, error } = await supabase
            .from('conversations')
            .insert({ employer_id: user.id, worker_id: workerId, status: 'pending' })
            .select('id')
            .single()

        if (conv) {
            router.push(`/conversation/${conv.id}`)
        } else {
            console.error('Error creating conversation:', error)
            setSelecting(null)
        }
    }

    const setTab = (t: string) => {
        router.push(`/employer/dashboard?tab=${t}`)
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 w-fit">
                {[
                    { key: 'search', label: 'Search Workers', icon: Search },
                    { key: 'post-job', label: 'Post a Job', icon: PlusCircle },
                    { key: 'active', label: 'Active Hires', icon: Briefcase },
                    { key: 'completed', label: 'Completed', icon: CheckCircle },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === key
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            {/* Post Job Tab */}
            {tab === 'post-job' && (
                <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Post a New Job</h2>
                        <p className="text-sm text-slate-500">Describe the work required. Nearby workers will be notified instantly via AI matching.</p>
                    </div>

                    <form onSubmit={handlePostJob} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                            <input required type="text" placeholder="e.g. Need an Expert Plumber" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none" />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-700">Detailed Description</label>
                                <button type="button" onClick={handleAIAutofill} disabled={isExtracting} className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50 transition-colors">
                                    <Sparkles className={`w-3 h-3 ${isExtracting ? 'animate-spin' : ''}`} />
                                    {isExtracting ? 'Extracting...' : 'AI Autofill Wage & Skills'}
                                </button>
                            </div>
                            <textarea required rows={4} placeholder="Describe the problem, tools needed, or specific requirements..." value={jobDesc} onChange={e => setJobDesc(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none resize-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Wage (₹)</label>
                                <input required type="number" placeholder="e.g. 500" value={jobWage} onChange={e => setJobWage(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <input required type="text" placeholder="e.g. Bhopal, MP" value={jobLocation} onChange={e => setJobLocation(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (comma separated)</label>
                            <input type="text" placeholder="e.g. Plumbing, Pipe Fitting" value={jobSkills.join(', ')} onChange={e => setJobSkills(e.target.value.split(',').map(s => s.trim()).filter(s => s))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none" />
                        </div>

                        <div className="pt-4">
                            <button disabled={isPosting} type="submit" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm disabled:opacity-50">
                                {isPosting ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <><PlusCircle className="w-5 h-5" /> Post Job & Notify Workers</>}
                            </button>
                            {postMsg && (
                                <p className={`mt-3 text-sm text-center font-medium ${postMsg.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {postMsg}
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Search Tab */}
            {tab === 'search' && (
                <div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Smart AI Search: e.g. Need an expert plumber in Bhopal"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchWorkers()}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none text-slate-900 placeholder-slate-400"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter className="w-4 h-4" /> Filters
                        </button>
                        <button onClick={fetchWorkers} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
                            Search
                        </button>
                    </div>

                    {showFilters && (
                        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Min Wage (₹)</label>
                                <input type="number" value={minWage} onChange={(e) => setMinWage(e.target.value)} placeholder="0" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Max Wage (₹)</label>
                                <input type="number" value={maxWage} onChange={(e) => setMaxWage(e.target.value)} placeholder="No limit" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Min Rating</label>
                                <input type="number" min="0" max="5" step="0.5" value={minRating} onChange={(e) => setMinRating(e.target.value)} placeholder="0" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                        </div>
                    )}

                    {loadingWorkers ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : workers.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No workers found. Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {workers.map((worker) => (
                                <div key={worker.user_id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900">{worker.profiles.name}</h3>
                                                {worker.profiles.aadhaar_verified && (
                                                    <span className="flex items-center gap-0.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                                        <CheckCircle className="w-3 h-3" /> Verified
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                                                <MapPin className="w-3.5 h-3.5" /> {worker.location || 'Not specified'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                            <span className="text-sm font-medium text-amber-700">{worker.profiles.rating || 0}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {(worker.skills || []).slice(0, 4).map((skill, i) => (
                                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">{skill}</span>
                                        ))}
                                        {(worker.skills || []).length > 4 && (
                                            <span className="text-xs text-slate-400">+{worker.skills.length - 4} more</span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {worker.experience || 0} yrs exp</span>
                                        <span className="flex items-center gap-1 font-semibold text-slate-700"><DollarSign className="w-3.5 h-3.5" /> ₹{worker.wage_expectation || 0}/day</span>
                                    </div>

                                    <button
                                        onClick={() => handleSelectWorker(worker.user_id)}
                                        disabled={selecting === worker.user_id}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {selecting === worker.user_id ? (
                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                        ) : (
                                            <><MessageSquare className="w-4 h-4" /> Select Worker</>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Active Hires Tab */}
            {tab === 'active' && (
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Active Hires</h2>
                    {activeHires.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No active hires yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeHires.map((conv) => (
                                <button key={conv.id} onClick={() => router.push(`/conversation/${conv.id}`)} className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-all text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Briefcase className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{conv.worker.name}</p>
                                            <p className="text-xs text-slate-500">Hired • {new Date(conv.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Completed Tab */}
            {tab === 'completed' && (
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Completed Hires</h2>
                    {completedHires.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                            <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No completed hires yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {completedHires.map((conv) => (
                                <button key={conv.id} onClick={() => router.push(`/conversation/${conv.id}`)} className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-all text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{conv.worker.name}</p>
                                            <p className="text-xs text-slate-500">Completed • {new Date(conv.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
