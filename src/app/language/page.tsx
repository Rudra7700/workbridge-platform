'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/lib/translation';
import { createClientComponentClient } from '@/lib/supabase-client'

export default function LanguageSelectionPage() {
    const router = useRouter();
    const { setLanguage } = useLanguage();
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLanguageSelect = async (languageCode: string) => {
        setSelectedLanguage(languageCode);
        setIsLoading(true);

        try {
            // Set language in context
            setLanguage(languageCode as 'en' | 'hi');

            // Update user preference in Supabase (if user is logged in)
            const supabase = createClientComponentClient()
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Note: This requires the preferred_language column in profiles table
                await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        preferred_language: languageCode,
                        updated_at: new Date().toISOString(),
                    });
            }

            // Redirect to dashboard after selection
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        } catch (error) {
            console.error('Error saving language preference:', error);
            // Still redirect even if save fails
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Select language</h1>

                <div className="grid grid-cols-2 gap-4">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            disabled={isLoading}
                            className={`
                bg-white rounded-2xl p-6 text-center transition-all
                ${selectedLanguage === lang.code
                                    ? 'ring-4 ring-pink-500 bg-pink-50'
                                    : 'hover:shadow-lg hover:scale-105'
                                }
                ${isLoading && selectedLanguage !== lang.code ? 'opacity-50' : ''}
                disabled:cursor-wait
              `}
                        >
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                                {lang.nativeName}
                            </div>
                            <div className="text-sm text-gray-500">
                                {lang.name}
                            </div>
                        </button>
                    ))}
                </div>

                {isLoading && (
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-600">
                            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Setting your language preference...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
