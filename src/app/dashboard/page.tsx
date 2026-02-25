'use client'

import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, FileText, LogOut, Settings, MessageSquare, Mic, Globe, Search, MapPin, Briefcase } from 'lucide-react'
import Link from 'next/link'

// Sample worker data
const sampleWorkers = [
    {
        id: 1,
        name: 'KrishnaMaurya Maurya',
        location: 'Raebareli, UTTAR PRADESH',
        skill: 'Labour',
        skillHindi: 'लेबर',
        price: 700,
        experience: '10+ Year exp',
        avatar: '/avatars/worker1.jpg'
    },
    {
        id: 2,
        name: 'Sanu Ali',
        location: 'Kannauj, UTTAR PRADESH',
        skill: 'Labour',
        skillHindi: 'लेबर',
        price: 600,
        experience: '6 Year exp',
        avatar: '/avatars/worker2.jpg'
    },
    {
        id: 3,
        name: 'Sandeep Bhurga',
        location: 'Lucknow, UTTAR PRADESH',
        skill: 'Labour',
        skillHindi: 'लेबर',
        price: 700,
        experience: '5 Year exp',
        avatar: '/avatars/worker3.jpg'
    },
    {
        id: 4,
        name: 'Rajesh Kumar',
        location: 'Varanasi, UTTAR PRADESH',
        skill: 'Labour',
        skillHindi: 'लेबर',
        price: 500,
        experience: '6 Year exp',
        avatar: '/avatars/worker4.jpg'
    }
];

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
}

// Skeleton loader for the dashboard
function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full skeleton" />
                    <div className="space-y-2">
                        <div className="skeleton-text w-20" />
                        <div className="skeleton-text w-32" />
                    </div>
                </div>
            </div>
            <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
                <div className="skeleton h-40 rounded-3xl" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-32 rounded-3xl" />
                ))}
            </div>
        </div>
    )
}

export default function Dashboard() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'hire' | 'find' | 'settings'>('hire')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        async function checkProfile() {
            if (!user) return

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error || !data) {
                router.push('/profile/create')
            } else {
                setProfile(data)
            }
            setLoading(false)
        }

        checkProfile()
    }, [user, router, supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) return <DashboardSkeleton />
    if (!profile) return null

    const filteredWorkers = sampleWorkers.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.location.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const aiFeatures = [
        { icon: MessageSquare, label: 'AI Chat', href: '/chat', color: 'from-blue-500 to-indigo-600' },
        { icon: Mic, label: 'Voice Translate', href: '/voice-translator', color: 'from-purple-500 to-pink-600' },
        { icon: Globe, label: 'Text Translate', href: '/translator', color: 'from-teal-500 to-cyan-600' },
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-white shadow-lg">
                        <span className="text-white font-bold text-lg">{profile.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{getGreeting()} 👋</p>
                        <p className="font-semibold text-slate-900">{profile.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/jobs"
                        className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                        aria-label="Browse jobs"
                    >
                        <Briefcase className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="p-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Sign out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6 pb-28 max-w-2xl mx-auto space-y-6">
                {/* AI Features Section */}
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl shadow-xl shadow-blue-600/20 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <h2 className="text-white font-bold text-lg mb-4 relative z-10">AI Features</h2>
                    <div className="grid grid-cols-3 gap-3 relative z-10">
                        {aiFeatures.map((feature) => (
                            <Link
                                key={feature.href}
                                href={feature.href}
                                className="group bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/25 transition-all duration-300 border border-white/10 hover:-translate-y-0.5"
                            >
                                <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-white text-xs font-medium">{feature.label}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search workers by name, skill, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                    />
                </div>

                {/* Worker Cards */}
                {filteredWorkers.length > 0 ? (
                    filteredWorkers.map((worker) => (
                        <div
                            key={worker.id}
                            className="bg-white rounded-3xl shadow-sm hover:shadow-xl p-6 transition-all duration-300 hover:-translate-y-1 border border-slate-100 gradient-border"
                        >
                            <div className="flex gap-4">
                                {/* Avatar */}
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    {worker.name.charAt(0)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 text-lg truncate">{worker.name}</h3>
                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{worker.location}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {worker.skill} ({worker.skillHindi})
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            {worker.experience}
                                        </span>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="text-right flex-shrink-0">
                                    <p className="text-2xl font-bold text-slate-900">₹{worker.price}</p>
                                    <p className="text-xs text-slate-500">per day</p>
                                </div>
                            </div>

                            {/* Select Button */}
                            <button className="w-full mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 font-semibold py-3 rounded-2xl transition-all border border-blue-100 hover:shadow-sm">
                                Select Worker
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <Search className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No workers found</p>
                        <p className="text-sm text-slate-400 mt-1">Try adjusting your search</p>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-4 left-4 right-4 z-20">
                <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-2xl shadow-slate-900/30 max-w-md mx-auto">
                    <div className="flex items-center justify-around">
                        {[
                            { id: 'hire' as const, icon: User, label: 'Hire Workers' },
                            { id: 'find' as const, icon: FileText, label: 'Find Projects' },
                            { id: 'settings' as const, icon: Settings, label: 'Settings' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <div className="relative">
                                    <tab.icon className="w-5 h-5" />
                                    {activeTab === tab.id && (
                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                                    )}
                                </div>
                                <span className="text-[10px] font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
