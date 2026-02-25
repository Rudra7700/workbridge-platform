'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Briefcase, MapPin, DollarSign, FileText, AlertTriangle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'

const jobSchema = z.object({
    skill: z.string().min(1, 'Skill is required'),
    wage: z.preprocess((val) => Number(val), z.number().min(1, 'Wage must be greater than 0')),
    location: z.string().min(1, 'Location is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    urgency: z.boolean(),
})

interface JobForm {
    skill: string
    wage: number
    location: string
    description: string
    urgency: boolean
}

export default function CreateJobPage() {
    const router = useRouter()
    const { user } = useAuth()
    const supabase = createClientComponentClient()
    const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success'>('idle')

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<JobForm>({
        resolver: zodResolver(jobSchema) as any,
        defaultValues: { urgency: false },
    })

    const watchedValues = watch()

    const onSubmit = async (data: JobForm) => {
        if (!user) return
        setSubmitState('loading')

        const { error } = await supabase.from('jobs').insert({
            ...data,
            employer_id: user.id,
        })

        if (error) {
            setSubmitState('idle')
            return
        }

        // Trigger n8n workflow (fire-and-forget)
        try {
            await fetch('https://n8n-rudra7700.cloud.sealos.run/webhook/9e119f84-db0e-4e2c-aac9-b4d00f56e37e', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
        } catch { /* ignore */ }

        setSubmitState('success')
        setTimeout(() => router.push('/jobs'), 1500)
    }

    if (submitState === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="text-center animate-fade-in">
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6 animate-pulse-soft">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Job Posted!</h2>
                    <p className="text-slate-500 mt-2">Redirecting to jobs listing...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Post a New Job</h1>
                    <p className="text-slate-500 mt-1">Fill in the details to find the right worker</p>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100 space-y-6">
                                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    Job Details
                                </h2>

                                {/* Skill */}
                                <div>
                                    <label htmlFor="skill" className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Skill Required
                                    </label>
                                    <input
                                        id="skill"
                                        {...register('skill')}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                        placeholder="e.g., Electrician, Plumber, Carpenter"
                                    />
                                    {errors.skill && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" /> {errors.skill.message}
                                        </p>
                                    )}
                                </div>

                                {/* Wage */}
                                <div>
                                    <label htmlFor="wage" className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Daily Wage (₹)
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            id="wage"
                                            type="number"
                                            {...register('wage')}
                                            className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                            placeholder="700"
                                        />
                                    </div>
                                    {errors.wage && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" /> {errors.wage.message}
                                        </p>
                                    )}
                                </div>

                                {/* Location */}
                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Location
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            id="location"
                                            {...register('location')}
                                            className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                            placeholder="City, State"
                                        />
                                    </div>
                                    {errors.location && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" /> {errors.location.message}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Description
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                        <textarea
                                            id="description"
                                            rows={4}
                                            {...register('description')}
                                            className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
                                            placeholder="Describe the work required, expected hours, and any other details..."
                                        />
                                    </div>
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" /> {errors.description.message}
                                        </p>
                                    )}
                                </div>

                                {/* Urgency Toggle */}
                                <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">Urgent Hiring</p>
                                            <p className="text-xs text-slate-500">Mark this job as urgent</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" {...register('urgency')} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitState === 'loading'}
                                className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {submitState === 'loading' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Posting Job...
                                    </>
                                ) : (
                                    <>
                                        Post Job
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Live Preview */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Preview</h3>
                            <div className="bg-white rounded-2xl p-5 shadow-lg ring-1 ring-slate-100">
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="text-lg font-semibold text-slate-900">
                                        {watchedValues.skill || 'Job Skill'}
                                    </h4>
                                    {watchedValues.urgency && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Urgent
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-3">
                                    {watchedValues.description || 'Job description will appear here...'}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                        <span className="font-medium">₹{watchedValues.wage || '---'}</span>
                                        <span className="text-slate-400">/day</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                        {watchedValues.location || 'Location'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
