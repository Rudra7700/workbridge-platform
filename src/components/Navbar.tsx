'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useState } from 'react'
import { Menu, X, Briefcase, LogOut } from 'lucide-react'

export default function Navbar() {
    const { user, signOut } = useAuth()
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    if (pathname === '/login' || pathname === '/signup' || pathname === '/register' || pathname.startsWith('/employer') || pathname.startsWith('/worker') || pathname.startsWith('/conversation')) return null

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', active: pathname === '/dashboard' },
    ]

    return (
        <nav className="sticky top-0 z-50 w-full glass" role="navigation" aria-label="Main navigation">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gradient">WorkBridge</span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden sm:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={clsx(
                                    'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                                    link.active
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="hidden sm:flex items-center gap-3">
                                <span className="text-sm text-slate-500 max-w-[160px] truncate">{user.email}</span>
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                    aria-label="Sign out"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="sm:hidden animate-slide-down border-t border-slate-100">
                    <div className="px-4 py-4 space-y-1 bg-white/95 backdrop-blur-xl">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={clsx(
                                    'block px-4 py-3 rounded-xl text-sm font-medium transition-all',
                                    link.active
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-3 mt-3 border-t border-slate-100">
                            {user ? (
                                <>
                                    <p className="px-4 py-2 text-sm text-slate-500 truncate">{user.email}</p>
                                    <button
                                        onClick={() => { signOut(); setMobileMenuOpen(false); }}
                                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                                        Sign in
                                    </Link>
                                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-center text-white bg-gradient-to-r from-blue-600 to-indigo-600">
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
