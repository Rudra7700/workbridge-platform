'use client'

import { useState } from 'react'
import { Volume2, Loader2, VolumeX } from 'lucide-react'

export default function PlayVoiceButton({ text, language = 'hi' }: { text: string, language?: string }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

    const handlePlayPause = async () => {
        if (isPlaying && audio) {
            audio.pause()
            setIsPlaying(false)
            return
        }

        if (audio) {
            audio.play()
            setIsPlaying(true)
            return
        }

        try {
            setIsLoading(true)

            // 1. First translate the text to Hindi
            const translateRes = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLang: language })
            })
            const { translation } = await translateRes.json()

            if (!translation) throw new Error("Translation failed")

            // 2. Generate Audio via ElevenLabs proxy
            const ttsRes = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: translation, language })
            })

            if (!ttsRes.ok) throw new Error("TTS failed")

            const blob = await ttsRes.blob()
            const url = URL.createObjectURL(blob)

            const newAudio = new Audio(url)
            newAudio.onended = () => setIsPlaying(false)

            setAudio(newAudio)
            newAudio.play()
            setIsPlaying(true)

        } catch (error) {
            console.error("Audio generation error:", error)
            alert("Could not load audio.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${isPlaying ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            title="Listen to this job"
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : isPlaying ? (
                <VolumeX className="w-5 h-5 text-blue-600 animate-pulse" />
            ) : (
                <Volume2 className="w-5 h-5" />
            )}
        </button>
    )
}
