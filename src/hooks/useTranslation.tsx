'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook for using translations in components
 * Returns translated text and loading state
 */
export function useTranslation(text: string | string[]): {
    translatedText: string | string[];
    isLoading: boolean;
} {
    const { language, t } = useLanguage();
    const [translatedText, setTranslatedText] = useState<string | string[]>(text);
    const [isLoading, setIsLoading] = useState(false);

    // Stabilize the text reference — arrays create new refs every render
    const textKey = useMemo(
        () => (Array.isArray(text) ? JSON.stringify(text) : text),
        [Array.isArray(text) ? text.join('\0') : text]
    );

    useEffect(() => {
        const currentText: string | string[] = Array.isArray(text) ? [...text] : text;

        async function translate() {
            if (language === 'en') {
                setTranslatedText(currentText);
                return;
            }

            setIsLoading(true);
            try {
                if (Array.isArray(currentText)) {
                    const translations = await Promise.all(currentText.map((item) => t(item)));
                    setTranslatedText(translations);
                } else {
                    const translation = await t(currentText);
                    setTranslatedText(translation);
                }
            } catch {
                // Silently fall back to original text
                setTranslatedText(currentText);
            } finally {
                setIsLoading(false);
            }
        }

        translate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [textKey, language, t]);

    return { translatedText, isLoading };
}

/**
 * Component wrapper for translated text
 */
export function T({ children }: { children: string }) {
    const { translatedText, isLoading } = useTranslation(children);

    if (isLoading) {
        return <span className="opacity-50">{children}</span>;
    }

    return <>{translatedText}</>;
}
