'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Building2, Phone, AlertTriangle, ArrowRight, Loader2, Briefcase } from 'lucide-react'

const profileSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    role: z.enum(['labourer', 'employer']),
    phone: z.string().min(10, 'Valid phone number is required'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function CreateProfilePage() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            role: 'labourer',
        },
    })

    const role = watch('role')

    const onSubmit = async (data: ProfileFormData) => {
        if (!user) return
        setLoading(true)
        setError(null)

        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    name: data.name,
                    role: data.role,
                    phone: data.phone,
                })

            if (profileError) throw profileError

            if (data.role === 'labourer') {
                const { error: labourerError } = await supabase
                    .from('labourer_profiles')
                    .insert({ user_id: user.id })
                if (labourerError) throw labourerError
            } else {
                const { error: employerError } = await supabase
                    .from('employer_profiles')
                    .insert({ user_id: user.id, company_name: '' })
                if (employerError) throw employerError
            }

            router.push('/dashboard')
            router.refresh()
        } catch (err: any) {
            setError(err?.message || 'Failed to create profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            <div className="w-full max-w-lg animate-fade-in">
                {/* Brand */}
                <div className="flex items-center gap-2 mb-8 justify-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gradient">WorkBridge</span>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    {/* Progress */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex-1 h-1.5 rounded-full bg-blue-600"></div>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100"></div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">Complete Your Profile</h1>
                        <p className="mt-2 text-sm text-slate-500">Tell us about yourself to get started</p>
                    </div>

                    {/* Role Selector Cards */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-3">I am a:</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setValue('role', 'labourer')}
                                className={`p-5 rounded-2xl border-2 text-left transition-all ${role === 'labourer'
                                    ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-500/10'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${role === 'labourer' ? 'bg-blue-100' : 'bg-slate-100'
                                    }`}>
                                    <User className={`w-5 h-5 ${role === 'labourer' ? 'text-blue-600' : 'text-slate-400'}`} />
                                </div>
                                <p className={`font-semibold ${role === 'labourer' ? 'text-blue-700' : 'text-slate-700'}`}>Worker</p>
                                <p className="text-xs text-slate-500 mt-1">Find jobs and earn</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setValue('role', 'employer')}
                                className={`p-5 rounded-2xl border-2 text-left transition-all ${role === 'employer'
                                    ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${role === 'employer' ? 'bg-indigo-100' : 'bg-slate-100'
                                    }`}>
                                    <Building2 className={`w-5 h-5 ${role === 'employer' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                </div>
                                <p className={`font-semibold ${role === 'employer' ? 'text-indigo-700' : 'text-slate-700'}`}>Employer</p>
                                <p className="text-xs text-slate-500 mt-1">Hire skilled workers</p>
                            </button>
                        </div>
                        {/* Hidden radio for form */}
                        <input type="hidden" {...register('role')} />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    {...register('name')}
                                    id="name"
                                    type="text"
                                    className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    {...register('phone')}
                                    id="phone"
                                    type="tel"
                                    className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.phone.message}
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 ring-1 ring-red-100 animate-shake">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Profile...
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
