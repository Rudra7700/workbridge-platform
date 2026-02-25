'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import { MapPin, DollarSign, Briefcase, AlertTriangle, User, Share2, ArrowLeft, CheckCircle, Loader2, Clock, Shield } from 'lucide-react'
import Link from 'next/link'

declare global {
    interface Window {
        Razorpay: any
    }
}

// Skeleton for loading state
function JobDetailSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 h-48"></div>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
                    <div className="space-y-3">
                        <div className="skeleton-text w-1/3" style={{ height: '28px' }} />
                        <div className="skeleton-text w-1/4" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton h-20 rounded-2xl" />
                        ))}
                    </div>
                    <div className="skeleton h-12 rounded-xl" />
                </div>
            </div>
        </div>
    )
}

export default function JobDetailPage() {
    const supabase = createClientComponentClient()
    const { user } = useAuth()
    const params = useParams()
    const router = useRouter()
    const [job, setJob] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState(false)
    const [applied, setApplied] = useState(false)
    const [profile, setProfile] = useState<any>(null)

    const { translatedText: labels } = useTranslation([
        'Apply Now',
        'Applied Successfully!',
        'Back to Jobs',
        'Share',
        'Job Details',
        'Wage',
        'Location',
        'Posted By',
        'Mark as Complete',
        'Make Payment',
    ])

    useEffect(() => {
        async function fetchData() {
            const { data: jobData } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', params.id)
                .single()
            if (jobData) setJob(jobData)

            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(profileData)
            }

            setLoading(false)
        }
        fetchData()
    }, [params.id, user, supabase])

    const handleApply = async () => {
        if (!user || !job) return
        setApplying(true)

        await supabase.from('job_applications').insert({
            job_id: job.id,
            worker_id: user.id,
            status: 'pending',
        })

        setApplied(true)
        setApplying(false)
    }

    const handlePayment = () => {
        if (!job) return
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || '',
            amount: job.wage * 100,
            currency: 'INR',
            name: 'WorkBridge',
            description: `Payment for ${job.skill}`,
            handler: async function () {
                await supabase.from('jobs').update({ status: 'paid' }).eq('id', job.id)
                router.refresh()
            },
            prefill: { email: user?.email },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${job.skill} - WorkBridge`,
                text: `Check out this job: ${job.skill} at ${job.location}`,
                url: window.location.href,
            })
        } else {
            navigator.clipboard.writeText(window.location.href)
        }
    }

    if (loading) return <JobDetailSkeleton />
    if (!job) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center animate-fade-in">
                <p className="text-lg font-semibold text-slate-700">Job not found</p>
                <Link href="/jobs" className="text-blue-600 hover:underline mt-2 inline-block">Back to Jobs</Link>
            </div>
        </div>
    )

    const isEmployer = user?.id === job.employer_id

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Gradient Header Banner */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 sm:px-6 pt-6 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/jobs"
                            className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">{labels[2]}</span>
                        </Link>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm hover:bg-white/25 transition-colors border border-white/20"
                        >
                            <Share2 className="w-4 h-4" />
                            {labels[3]}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-12">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-100/50 overflow-hidden animate-fade-in">
                    <div className="p-6 sm:p-8">
                        {/* Title */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{job.skill}</h1>
                                {job.created_at && (
                                    <div className="flex items-center gap-1 mt-1 text-sm text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        Posted {new Date(job.created_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                            {job.urgency && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 animate-pulse-soft border border-amber-100">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-semibold">Urgent</span>
                                </div>
                            )}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="text-xs font-medium text-green-700 uppercase tracking-wider">{labels[5]}</span>
                                </div>
                                <p className="text-2xl font-bold text-green-700">₹{job.wage}</p>
                                <p className="text-xs text-green-600 mt-0.5">per day</p>
                            </div>

                            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">{labels[6]}</span>
                                </div>
                                <p className="text-lg font-semibold text-blue-700">{job.location}</p>
                            </div>

                            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Briefcase className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-700 uppercase tracking-wider">Skill</span>
                                </div>
                                <p className="text-lg font-semibold text-purple-700">{job.skill}</p>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</span>
                                </div>
                                <p className="text-lg font-semibold text-slate-700 capitalize">{job.status || 'Open'}</p>
                            </div>
                        </div>

                        {/* Description */}
                        {job.description && (
                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Description</h3>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                            </div>
                        )}

                        {/* Actions */}
                        {!isEmployer && !applied && (
                            <button
                                onClick={handleApply}
                                disabled={applying}
                                className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {applying ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        {labels[0]}
                                        <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        )}

                        {applied && (
                            <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-green-50 text-green-700 border border-green-100 animate-fade-in">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-semibold">{labels[1]}</span>
                            </div>
                        )}

                        {isEmployer && job.status === 'completed' && (
                            <button
                                onClick={handlePayment}
                                className="w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-green-600/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {labels[9]} — ₹{job.wage}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
