'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import JobCard from '@/components/JobCard'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { Search, Plus, SlidersHorizontal, Briefcase } from 'lucide-react'

const FILTER_CHIPS = ['All', 'Electrician', 'Plumber', 'Labour', 'Carpenter', 'Painter', 'Welder']

// Skeleton card component
function JobCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <div className="skeleton-text w-1/3" />
                    <div className="skeleton-text w-1/5" style={{ height: '12px' }} />
                </div>
                <div className="skeleton w-16 h-6 rounded-full" />
            </div>
            <div className="skeleton-text w-full" />
            <div className="skeleton-text w-2/3" />
            <div className="flex gap-4">
                <div className="skeleton w-24 h-7 rounded-lg" />
                <div className="skeleton w-32 h-7 rounded-lg" />
            </div>
        </div>
    )
}

export default function JobsPage() {
    const supabase = createClientComponentClient()
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [activeChip, setActiveChip] = useState('All')
    const { translatedText: labels } = useTranslation([
        'Available Jobs',
        'Find your next opportunity',
        'Search by skill or location...',
        'No jobs found',
        'Try adjusting your search or filters',
        'Post a Job'
    ])

    useEffect(() => {
        async function fetchJobs() {
            const { data } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false })
            if (data) setJobs(data)
            setLoading(false)
        }
        fetchJobs()
    }, [supabase])

    const filteredJobs = jobs.filter(j => {
        const matchesSearch = j.skill?.toLowerCase().includes(filter.toLowerCase()) ||
            j.location?.toLowerCase().includes(filter.toLowerCase())
        const matchesChip = activeChip === 'All' ||
            j.skill?.toLowerCase() === activeChip.toLowerCase()
        return matchesSearch && matchesChip
    })

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 sm:px-6 pt-8 pb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="max-w-3xl mx-auto relative z-10">
                    <h1 className="text-3xl font-bold text-white">{labels[0]}</h1>
                    <p className="text-blue-100 mt-1">{labels[1]}</p>
                </div>
            </div>

            {/* Search and content */}
            <div className="px-4 sm:px-6 max-w-3xl mx-auto -mt-8 relative z-10 pb-24">
                {/* Search bar */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-2 ring-1 ring-slate-100/50 mb-6">
                    <div className="flex items-center gap-3 px-3">
                        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder={labels[2]}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full py-3 text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                        />
                        <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors" aria-label="Filters">
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    {FILTER_CHIPS.map(chip => (
                        <button
                            key={chip}
                            onClick={() => setActiveChip(chip)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeChip === chip
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {chip}
                        </button>
                    ))}
                </div>

                {/* Job list */}
                <div className="space-y-4 mt-4">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <JobCardSkeleton key={i} />)
                    ) : filteredJobs.length > 0 ? (
                        filteredJobs.map(job => (
                            <JobCard
                                key={job.id}
                                id={job.id}
                                skill={job.skill}
                                wage={job.wage}
                                location={job.location}
                                urgency={job.urgency}
                                description={job.description}
                                created_at={job.created_at}
                            />
                        ))
                    ) : (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <Briefcase className="w-9 h-9 text-slate-300" />
                            </div>
                            <p className="text-lg font-semibold text-slate-700">{labels[3]}</p>
                            <p className="text-sm text-slate-400 mt-1">{labels[4]}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FAB - Post a Job */}
            <Link
                href="/jobs/create"
                className="fixed bottom-8 right-6 z-20 flex items-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all hover:-translate-y-1"
            >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">{labels[5]}</span>
            </Link>
        </div>
    )
}
