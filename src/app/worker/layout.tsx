'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { HardHat, LogOut, User, FileText, Briefcase, DollarSign, CheckCircle, MessageSquare, Home, Search } from 'lucide-react'
import Link from 'next/link'
import LanguageToggle from '@/components/LanguageToggle'
import { useLanguage } from '@/contexts/LanguageContext'

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading, signOut } = useAuth()
    const { t } = useLanguage()
    const router = useRouter()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    if (!profile || profile.role !== 'worker') {
        if (!loading && profile?.role === 'employer') {
            router.push('/employer/dashboard')
        }

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="animate-pulse text-slate-500 font-medium text-lg">
                    {!profile ? 'Please log in as a Worker to access this dashboard.' : 'Redirecting to correct dashboard...'}
                </div>
                {!profile && (
                    <button onClick={signOut} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">Return to Login</button>
                )}
            </div>
        )
    }

    if (!profile || profile.role !== 'worker') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="animate-pulse text-slate-500 font-medium text-lg">
                    {!profile ? 'Profile not found. Signing out...' : 'Redirecting to correct dashboard...'}
                </div>
                <div className="h-1 w-48 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 animate-[loading_1s_infinite]"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/worker/dashboard" className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                                    <HardHat className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold text-slate-900">WorkBridge</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Worker</span>
                            </Link>
                            <div className="hidden md:flex items-center gap-1">
                                <Link href="/worker/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                                    <Home className="w-4 h-4" /> {t('dashboard')}
                                </Link>
                                <Link href="/worker/jobs" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                                    <Search className="w-4 h-4" /> {t('findJobs')}
                                </Link>
                                <Link href="/worker/dashboard?tab=profile" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                                    <User className="w-4 h-4" /> {t('profile')}
                                </Link>
                                <Link href="/worker/dashboard?tab=documents" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                                    <FileText className="w-4 h-4" /> {t('documents')}
                                </Link>
                                <Link href="/worker/dashboard?tab=requests" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                                    <Briefcase className="w-4 h-4" /> {t('hireRequests')}
                                </Link>
                                <Link href="/worker/dashboard?tab=earnings" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                                    <DollarSign className="w-4 h-4" /> {t('earnings')}
                                </Link>
                                <Link href="/chat" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                                    <MessageSquare className="w-4 h-4" /> {t('aiChat')}
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <LanguageToggle />
                                {profile.aadhaar_verified && (
                                    <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                        <CheckCircle className="w-3 h-3" /> Verified
                                    </span>
                                )}
                                <span className="text-sm text-slate-500">{profile.name}</span>
                            </div>
                            <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors">
                                <LogOut className="w-4 h-4" /> {t('logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main>{children}</main>
        </div>
    )
}
