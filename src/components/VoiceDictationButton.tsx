'use client'

import { useState, useEffect } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function VoiceDictationButton({ onResult }: { onResult: (text: string) => void }) {
    const [isListening, setIsListening] = useState(false)
    const [recognition, setRecognition] = useState<any>(null)
    const { language } = useLanguage()

    useEffect(() => {
        // Initialize Speech Recognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognition) {
                const rec = new SpeechRecognition()
                rec.continuous = false
                rec.interimResults = false
                // Default to Hindi since this is for MP workers, but switchable
                rec.lang = language === 'hi' ? 'hi-IN' : 'en-IN'

                rec.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript
                    onResult(transcript)
                    setIsListening(false)
                }

                rec.onerror = (event: any) => {
                    console.error("Speech recognition error:", event.error)
                    setIsListening(false)
                }

                rec.onend = () => {
                    setIsListening(false)
                }

                setRecognition(rec)
            }
        }
    }, [language, onResult])

    const toggleListening = () => {
        if (!recognition) {
            alert("Your browser does not support voice search. Try Google Chrome.")
            return
        }

        if (isListening) {
            recognition.stop()
        } else {
            recognition.start()
            setIsListening(true)
        }
    }

    if (!recognition) return null // Hide if browser doesn't support it

    return (
        <button
            onClick={toggleListening}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            title="Search with Voice"
        >
            <Mic className="w-4 h-4" />
        </button>
    )
}
