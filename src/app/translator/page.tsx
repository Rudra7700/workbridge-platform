'use client'

import { useState } from 'react'
import { Languages, Copy, Loader2, Check } from 'lucide-react'

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'bn', name: 'Bengali (বাংলা)' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
]

export default function TranslatorPage() {
    const [inputText, setInputText] = useState('')
    const [outputText, setOutputText] = useState('')
    const [targetLanguage, setTargetLanguage] = useState('hi')
    const [isLoading, setIsLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleTranslate = async () => {
        if (!inputText.trim()) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/translate-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: inputText,
                    targetLanguage: LANGUAGES.find(l => l.code === targetLanguage)?.name || 'Hindi',
                    sourceLanguage: null
                })
            })

            if (!response.ok) throw new Error('Translation failed')

            const data = await response.json()
            setOutputText(data.translatedText)
        } catch (error) {
            console.error('Translation error:', error)
            setOutputText('Translation failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(outputText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 mb-4">
                        <Languages className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Text Translator</h1>
                    <p className="text-gray-600">Translate text to 10 Indian languages instantly</p>
                </div>

                {/* Language Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Translate to:
                    </label>
                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Translation Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Input */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Original Text</h3>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter text to translate..."
                            className="w-full h-64 rounded-lg border border-gray-300 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Output */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700">Translation</h3>
                            {outputText && (
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="w-full h-64 rounded-lg border border-gray-200 bg-gray-50 p-4 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                </div>
                            ) : (
                                <p className="text-gray-900 whitespace-pre-wrap">{outputText || 'Translation will appear here...'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Translate Button */}
                <div className="text-center">
                    <button
                        onClick={handleTranslate}
                        disabled={isLoading || !inputText.trim()}
                        className="bg-gradient-to-br from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? 'Translating...' : 'Translate'}
                    </button>
                </div>
            </div>
        </div>
    )
}
