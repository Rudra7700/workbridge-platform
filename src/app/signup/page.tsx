'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Eye, EyeOff, Briefcase, ArrowRight, AlertCircle, CheckCircle, Check, HardHat, Building2 } from 'lucide-react'

export default function SignupPage() {
    const { signUp, signInWithGoogle } = useAuth()
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [role, setRole] = useState<'employer' | 'worker' | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const passwordStrength = useMemo(() => {
        if (!password) return { score: 0, label: '', color: 'bg-slate-200' }
        let score = 0
        if (password.length >= 6) score++
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++

        if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
        if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' }
        if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' }
        if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-green-500' }
        return { score: 5, label: 'Very Strong', color: 'bg-emerald-500' }
    }, [password])

    const passwordsMatch = confirmPassword && password === confirmPassword

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!role) {
            setError('Please select a role: Employer or Worker')
            return
        }

        if (!name.trim()) {
            setError('Please enter your full name')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        const { error } = await signUp(email, password, name, role)
        if (error) {
            setError(error)
        } else {
            setSuccess(true)
        }
        setLoading(false)
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
                        <p className="mt-3 text-slate-500 leading-relaxed">
                            We&apos;ve sent a confirmation link to <span className="font-semibold text-slate-700">{email}</span>.
                            Click the link to verify your account and get started.
                        </p>
                        <Link
                            href="/login"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
                        >
                            Back to Login
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            {/* Left Panel - Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-12 flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">WorkBridge</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-4xl font-bold text-white leading-tight">
                        Start Your<br />Journey Today
                    </h2>
                    <p className="text-blue-100 text-lg max-w-md leading-relaxed">
                        Create an account and get instant access to thousands of job opportunities or skilled workers.
                    </p>

                    <div className="space-y-4 mt-8">
                        {['Smart worker matching', 'Verified digital work passport', 'Secure payments & tracking'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-blue-50">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-blue-200 text-sm">
                    © 2026 WorkBridge. All rights reserved.
                </p>
            </div>

            {/* Right Panel - Form */}
            <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile brand */}
                    <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">WorkBridge</span>
                    </div>

                    <div className="rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
                            <p className="mt-2 text-sm text-slate-500">Join WorkBridge as an employer or worker</p>
                        </div>

                        {/* Role Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-3">I am a...</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('employer')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === 'employer'
                                            ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'employer' ? 'bg-blue-500' : 'bg-slate-100'
                                        }`}>
                                        <Building2 className={`w-6 h-6 ${role === 'employer' ? 'text-white' : 'text-slate-500'}`} />
                                    </div>
                                    <span className={`text-sm font-semibold ${role === 'employer' ? 'text-blue-700' : 'text-slate-700'}`}>
                                        Employer
                                    </span>
                                    <span className="text-xs text-slate-400">Hire workers</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRole('worker')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === 'worker'
                                            ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'worker' ? 'bg-emerald-500' : 'bg-slate-100'
                                        }`}>
                                        <HardHat className={`w-6 h-6 ${role === 'worker' ? 'text-white' : 'text-slate-500'}`} />
                                    </div>
                                    <span className={`text-sm font-semibold ${role === 'worker' ? 'text-emerald-700' : 'text-slate-700'}`}>
                                        Worker
                                    </span>
                                    <span className="text-xs text-slate-400">Find work</span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={signInWithGoogle}
                            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="my-6 flex items-center">
                            <div className="flex-1 border-t border-slate-200"></div>
                            <span className="px-4 text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
                            <div className="flex-1 border-t border-slate-200"></div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength.score ? passwordStrength.color : 'bg-slate-100'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{passwordStrength.label}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`block w-full rounded-xl border px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:outline-none focus:ring-4 ${passwordsMatch
                                            ? 'border-green-300 focus:border-green-500 focus:ring-green-500/10'
                                            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                                            }`}
                                        placeholder="••••••••"
                                    />
                                    {passwordsMatch && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 ring-1 ring-red-100">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-500">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
