'use client'

import Link from 'next/link'
import { MapPin, DollarSign, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobCardProps {
    id: string
    skill: string
    wage: number
    location: string
    urgency: boolean
    description?: string
    created_at?: string
}

function timeAgo(dateString?: string): string {
    if (!dateString) return ''
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(dateString).toLocaleDateString()
}

export default function JobCard({ id, skill, wage, location, urgency, description, created_at }: JobCardProps) {
    return (
        <Link href={`/jobs/${id}`} className="block group">
            <div className={cn(
                'bg-white rounded-2xl p-5 border shadow-sm transition-all duration-300',
                'group-hover:shadow-xl group-hover:-translate-y-1 gradient-border',
                urgency
                    ? 'border-amber-200 ring-1 ring-amber-100'
                    : 'border-slate-100'
            )}>
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {skill}
                        </h3>
                        {created_at && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />
                                {timeAgo(created_at)}
                            </div>
                        )}
                    </div>
                    {urgency && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 animate-pulse-soft">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">Urgent</span>
                        </div>
                    )}
                </div>

                {description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-bold text-slate-900 text-base">₹{wage}</span>
                        <span className="text-slate-400">/day</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="truncate max-w-[160px]">{location}</span>
                    </div>
                </div>

                {/* Hover CTA */}
                <div className="mt-4 flex items-center justify-end gap-1 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    View Details
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    )
}
