'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import i18n from '../i18n'

type Language = 'en' | 'hi'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Check local storage for saved preference on mount
        const saved = localStorage.getItem('languagePreference') as Language
        if (saved && (saved === 'en' || saved === 'hi')) {
            setLanguageState(saved)
            i18n.changeLanguage(saved)
        }
        setMounted(true)
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        i18n.changeLanguage(lang)
        localStorage.setItem('languagePreference', lang)
    }

    // Simple translation wrapper
    const t = (key: string) => {
        return i18n.t(key)
    }

    // Prevent hydration mismatch
    if (!mounted) return <>{children}</>

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
