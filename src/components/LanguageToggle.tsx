'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Languages } from 'lucide-react'

export default function LanguageToggle() {
    const { language, setLanguage } = useLanguage()

    return (
        <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
        >
            <Languages className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-slate-700">
                {language === 'en' ? 'हिन्दी' : 'English'}
            </span>
        </button>
    )
}
