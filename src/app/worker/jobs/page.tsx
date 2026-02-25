'use client'

import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, DollarSign, Search, Filter, Clock } from 'lucide-react'
import PlayVoiceButton from '@/components/PlayVoiceButton'
import VoiceDictationButton from '@/components/VoiceDictationButton'

interface Job {
    id: string
    employer_id: string
    title: string
    description: string
    skill_tags: string[]
    wage: number
    location_text: string
    status: string
    created_at: string
}

export default function WorkerJobsBoard() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const supabase = createClientComponentClient()

    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [skillFilter, setSkillFilter] = useState('')

    useEffect(() => {
        if (!authLoading && profile && profile.role !== 'worker') {
            router.push('/employer/dashboard')
        }
    }, [profile, authLoading, router])

    const fetchJobs = useCallback(async () => {
        setLoading(true)

        // Build query
        let query = supabase
            .from('jobs')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: false })

        if (searchQuery) {
            query = query.ilike('title', `%${searchQuery}%`)
        }

        if (skillFilter) {
            query = query.contains('skill_tags', [skillFilter.toLowerCase()])
        }

        const { data, error } = await query

        if (!error && data) {
            setJobs(data as Job[])
        } else {
            console.error('Error fetching jobs:', error)
        }

        setLoading(false)
    }, [supabase, searchQuery, skillFilter])

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    const handleApply = async (jobId: string, employerId: string) => {
        if (!user) return

        // Optimistic UI could go here. For now, we'll create a conversation request.
        const { error } = await supabase.from('conversations').insert({
            worker_id: user.id,
            employer_id: employerId,
            status: 'pending'
        })

        if (!error) {
            alert('Application sent successfully!')
            router.push('/worker/dashboard?tab=requests')
        } else {
            alert('Error applying to job or request already exists.')
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Job Board</h1>
                <p className="text-slate-500">Find and apply for open positions in your area.</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search jobs by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none"
                    />
                    <VoiceDictationButton onResult={setSearchQuery} />
                </div>
                <div className="relative sm:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter by skill (e.g. plumber)"
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none"
                    />
                </div>
            </div>

            {/* Job Listings */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No jobs found</h3>
                    <p className="text-slate-500">Try adjusting your filters or check back later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col hover:border-emerald-400 transition-colors shadow-sm">
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                                    <PlayVoiceButton text={`${job.title}. ${job.description}`} language="hi" />
                                </div>

                                <div className="flex flex-wrap gap-3 mb-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span>{job.location_text}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                        <span className="font-medium text-emerald-700">₹{job.wage}/day</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                                    {job.description}
                                </p>

                                {job.skill_tags && job.skill_tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {job.skill_tags.map(skill => (
                                            <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleApply(job.id, job.employer_id)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors mt-auto"
                            >
                                Apply Now
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
