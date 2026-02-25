'use client'

import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, FileText, Briefcase, DollarSign, CheckCircle, Upload, Star, Clock, ChevronRight, AlertCircle, Save, Shield, BadgeCheck } from 'lucide-react'

interface WorkerProfile {
    skills: string[]
    experience: number
    wage_expectation: number
    location: string
    total_earnings: number
    total_jobs: number
}

interface PushToken {
    token: string
}

interface Document {
    id: string
    document_type: string
    document_url: string
    verification_status: string
    created_at: string
}

interface ConversationItem {
    id: string
    employer_id: string
    status: string
    created_at: string
    employer_name: string
}

export default function WorkerDashboard() {
    const { user, profile, refreshProfile, loading: authLoading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const tab = searchParams.get('tab') || 'overview'
    const supabase = createClientComponentClient()

    useEffect(() => {
        if (!authLoading && profile === null) {
            return
        }
        if (!authLoading && profile && profile.role !== 'worker') {
            router.push('/employer/dashboard')
        }
    }, [profile, authLoading, router])

    const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null)
    const [documents, setDocuments] = useState<Document[]>([])
    const [pendingRequests, setPendingRequests] = useState<ConversationItem[]>([])
    const [activeWork, setActiveWork] = useState<ConversationItem[]>([])
    const [completedWork, setCompletedWork] = useState<ConversationItem[]>([])
    const [loading, setLoading] = useState(true)

    // Editable fields
    const [editSkills, setEditSkills] = useState('')
    const [editExperience, setEditExperience] = useState(0)
    const [editWage, setEditWage] = useState(0)
    const [editLocation, setEditLocation] = useState('')
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')
    const [pushEnabled, setPushEnabled] = useState(false)
    const [togglingPush, setTogglingPush] = useState(false)

    const fetchData = useCallback(async () => {
        if (!user) return
        setLoading(true)

        // Run all independent queries in parallel
        const [wpResult, docsResult, convsResult, pushResult] = await Promise.all([
            supabase.from('worker_profiles').select('*').eq('user_id', user.id).single(),
            supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('conversations').select('id, employer_id, status, created_at').eq('worker_id', user.id),
            supabase.from('worker_push_tokens').select('token').eq('user_id', user.id).limit(1)
        ])

        // Set worker profile
        const wp = wpResult.data
        if (wp) {
            setWorkerProfile(wp)
            setEditSkills((wp.skills || []).join(', '))
            setEditExperience(wp.experience || 0)
            setEditWage(wp.wage_expectation || 0)
            setEditLocation(wp.location || '')
        }

        // Set documents
        setDocuments(docsResult.data || [])

        // Set push status
        if (pushResult.data && pushResult.data.length > 0) {
            setPushEnabled(true)
        } else {
            setPushEnabled(false)
        }

        // Batch-fetch employer names for all conversations at once
        const convs = convsResult.data || []
        const employerIds = [...new Set(convs.map(c => c.employer_id))]
        let employerMap: Record<string, string> = {}
        if (employerIds.length > 0) {
            const { data: employers } = await supabase.from('profiles').select('id, name').in('id', employerIds)
            employerMap = Object.fromEntries((employers || []).map(e => [e.id, e.name]))
        }

        const enriched: ConversationItem[] = convs.map(c => ({
            ...c,
            employer_name: employerMap[c.employer_id] || 'Unknown'
        }))

        setPendingRequests(enriched.filter(c => c.status === 'pending'))
        setActiveWork(enriched.filter(c => c.status === 'hired'))
        setCompletedWork(enriched.filter(c => c.status === 'completed'))
        setLoading(false)
    }, [user])

    useEffect(() => { fetchData() }, [fetchData])

    const handleSaveProfile = async () => {
        if (!user) return
        setSaving(true)
        setSaveMsg('')

        const skills = editSkills.split(',').map(s => s.trim()).filter(Boolean)

        let profileEmbedding = null
        try {
            const embedStr = `${skills.join(' ')} ${editLocation} worker expert`
            const embedRes = await fetch('/api/embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: embedStr })
            })
            if (embedRes.ok) {
                const embedData = await embedRes.json()
                if (embedData.embedding) {
                    profileEmbedding = embedData.embedding
                }
            }
        } catch (embedErr) {
            console.error('Non-fatal embedding err:', embedErr)
        }

        const { error } = await supabase.from('worker_profiles').upsert({
            user_id: user.id,
            skills,
            experience: editExperience,
            wage_expectation: editWage,
            location: editLocation,
            embedding: profileEmbedding
        })

        if (error) {
            setSaveMsg('Error saving profile')
        } else {
            setSaveMsg('Profile saved!')
            setWorkerProfile(prev => prev ? { ...prev, skills, experience: editExperience, wage_expectation: editWage, location: editLocation } : null)
        }
        setSaving(false)
        setTimeout(() => setSaveMsg(''), 3000)
    }

    const handleUploadAadhaar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files?.[0]) return
        setUploading(true)

        const file = e.target.files[0]
        const filePath = `${user.id}/aadhaar_${Date.now()}.${file.name.split('.').pop()}`

        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            setUploading(false)
            return
        }

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)

        // Insert document record
        await supabase.from('documents').insert({
            user_id: user.id,
            document_type: 'aadhaar',
            document_url: urlData.publicUrl,
            verification_status: 'pending',
        })

        // Require admin approval before setting aadhaar_verified to true
        await refreshProfile()
        await fetchData()
        setUploading(false)
    }

    const handleTogglePush = async () => {
        if (!user) return
        setTogglingPush(true)

        if (pushEnabled) {
            // Disable push
            await supabase.from('worker_push_tokens').delete().eq('user_id', user.id)
            setPushEnabled(false)
            setTogglingPush(false)
        } else {
            // Enable push
            if (!('Notification' in window)) {
                alert('This browser does not support desktop notification')
                setTogglingPush(false)
                return
            }

            try {
                const permission = await Notification.requestPermission()
                if (permission === 'granted') {
                    // For hackathon: using a mock unique device token. In prod, use Firebase getMessaging().getToken()
                    const mockToken = `web-push-token-${user.id}-${Date.now()}`

                    await supabase.from('worker_push_tokens').insert({
                        user_id: user.id,
                        token: mockToken,
                        device_type: navigator.userAgent
                    })

                    setPushEnabled(true)
                    new Notification('WorkBridge', {
                        body: 'You are now subscribed to Job Alerts!',
                        icon: '/globe.svg' // any generic icon
                    })
                } else {
                    alert('You need to allow notifications to get job alerts.')
                }
            } catch (err) {
                console.error("Failed to enable push:", err)
            } finally {
                setTogglingPush(false)
            }
        }
    }

    const setTab = (t: string) => router.push(`/worker/dashboard?tab=${t}`)

    // Profile completion meter
    const completion = (() => {
        let score = 0
        const total = 5
        if (profile?.name) score++
        if (workerProfile?.skills?.length) score++
        if (workerProfile?.experience) score++
        if (workerProfile?.wage_expectation) score++
        if (profile?.aadhaar_verified) score++
        return Math.round((score / total) * 100)
    })()

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Overview Cards */}
            {tab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-slate-500">Profile</p>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                            <div className="relative w-full bg-slate-100 rounded-full h-2.5 mb-1">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${completion}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-400">{completion}% complete</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-500">Verification</p>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${profile?.aadhaar_verified ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                    {profile?.aadhaar_verified ? <BadgeCheck className="w-4 h-4 text-emerald-600" /> : <Shield className="w-4 h-4 text-amber-600" />}
                                </div>
                            </div>
                            <p className={`text-lg font-bold ${profile?.aadhaar_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {profile?.aadhaar_verified ? 'Verified' : 'Pending'}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-500">Earnings</p>
                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                </div>
                            </div>
                            <p className="text-lg font-bold text-slate-900">₹{workerProfile?.total_earnings || 0}</p>
                            <p className="text-xs text-slate-400">{workerProfile?.total_jobs || 0} jobs completed</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-500">Rating</p>
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <Star className="w-4 h-4 text-amber-500" />
                                </div>
                            </div>
                            <p className="text-lg font-bold text-slate-900">{profile?.rating || 0} / 5</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {pendingRequests.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                    <h3 className="font-semibold text-amber-800">{pendingRequests.length} Hire Request{pendingRequests.length > 1 ? 's' : ''}</h3>
                                </div>
                                <p className="text-sm text-amber-700 mb-3">You have pending hire requests!</p>
                                <button onClick={() => setTab('requests')} className="text-sm font-medium text-amber-700 hover:text-amber-800">
                                    View Requests →
                                </button>
                            </div>
                        )}
                        {activeWork.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-blue-800">{activeWork.length} Active Job{activeWork.length > 1 ? 's' : ''}</h3>
                                </div>
                                <button onClick={() => setTab('active')} className="text-sm font-medium text-blue-700 hover:text-blue-800">
                                    View Active Work →
                                </button>
                            </div>
                        )}
                        {!profile?.aadhaar_verified && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-5 h-5 text-red-600" />
                                    <h3 className="font-semibold text-red-800">Not Verified</h3>
                                </div>
                                <p className="text-sm text-red-700 mb-3">Upload Aadhaar to get verified.</p>
                                <button onClick={() => setTab('documents')} className="text-sm font-medium text-red-700 hover:text-red-800">
                                    Upload Documents →
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Tab Navigation for sub-tabs */}
            {tab !== 'overview' && (
                <button onClick={() => setTab('overview')} className="text-sm text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1">
                    ← Back to Overview
                </button>
            )}

            {/* Profile Tab */}
            {tab === 'profile' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">My Profile</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma separated)</label>
                            <input type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none" placeholder="e.g. Plumbing, Electrical, Carpentry" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years)</label>
                                <input type="number" value={editExperience} onChange={(e) => setEditExperience(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Wage (₹/day)</label>
                                <input type="number" value={editWage} onChange={(e) => setEditWage(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                            <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none" placeholder="e.g. Mumbai, India" />
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                            <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                            {saveMsg && <span className={`text-sm ${saveMsg.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>{saveMsg}</span>}
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Job Alerts (Push Notifications)</h3>
                        <p className="text-sm text-slate-500 mb-4">Get notified instantly on your device when a new job matching your skills gets posted nearby.</p>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <div>
                                <p className="font-medium text-slate-900">{pushEnabled ? 'Notifications Active' : 'Notifications Off'}</p>
                                <p className="text-xs text-slate-500">{pushEnabled ? 'You will receive instant alerts for matched jobs.' : 'Turn this on to never miss a job opportunity.'}</p>
                            </div>
                            <button
                                onClick={handleTogglePush}
                                disabled={togglingPush}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${pushEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Documents Tab */}
            {tab === 'documents' && (
                <div className="max-w-2xl">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">My Documents</h2>

                    {!profile?.aadhaar_verified && (
                        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 text-center mb-6 hover:border-emerald-400 transition-colors">
                            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                            <p className="text-slate-600 font-medium mb-1">Upload Aadhaar Card</p>
                            <p className="text-sm text-slate-400 mb-4">JPG, PNG or PDF (max 5MB)</p>
                            <label className="cursor-pointer inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Uploading...' : 'Choose File'}
                                <input type="file" accept="image/*,.pdf" onChange={handleUploadAadhaar} className="hidden" disabled={uploading} />
                            </label>
                        </div>
                    )}

                    {profile?.aadhaar_verified && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 mb-6">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                            <div>
                                <p className="font-medium text-emerald-800">Aadhaar Verified</p>
                                <p className="text-sm text-emerald-600">Your identity has been verified</p>
                            </div>
                        </div>
                    )}

                    {documents.length > 0 && (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        <div>
                                            <p className="font-medium text-slate-900 capitalize">{doc.document_type}</p>
                                            <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${doc.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : doc.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {doc.verification_status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Hire Requests Tab */}
            {tab === 'requests' && (
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Incoming Hire Requests</h2>
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No pending hire requests.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingRequests.map((conv) => (
                                <button key={conv.id} onClick={() => router.push(`/conversation/${conv.id}`)} className="w-full bg-white rounded-xl border border-amber-200 p-4 flex items-center justify-between hover:shadow-md transition-all text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{conv.employer_name}</p>
                                            <p className="text-xs text-slate-500">Pending • {new Date(conv.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Active Work Tab */}
            {tab === 'active' && (
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Active Work</h2>
                    {activeWork.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No active work right now.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeWork.map((conv) => (
                                <button key={conv.id} onClick={() => router.push(`/conversation/${conv.id}`)} className="w-full bg-white rounded-xl border border-blue-200 p-4 flex items-center justify-between hover:shadow-md transition-all text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Briefcase className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{conv.employer_name}</p>
                                            <p className="text-xs text-slate-500">Active • {new Date(conv.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Earnings Tab */}
            {tab === 'earnings' && (
                <div className="max-w-2xl">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Earnings Summary</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <p className="text-sm text-slate-500 mb-1">Total Earnings</p>
                            <p className="text-3xl font-bold text-emerald-600">₹{workerProfile?.total_earnings || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <p className="text-sm text-slate-500 mb-1">Jobs Completed</p>
                            <p className="text-3xl font-bold text-slate-900">{workerProfile?.total_jobs || 0}</p>
                        </div>
                    </div>
                    {completedWork.length > 0 && (
                        <>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">Completed Work</h3>
                            <div className="space-y-3">
                                {completedWork.map((conv) => (
                                    <div key={conv.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            <div>
                                                <p className="font-medium text-slate-900">{conv.employer_name}</p>
                                                <p className="text-xs text-slate-500">{new Date(conv.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
