'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Image as ImageIcon, X } from 'lucide-react'

// Declare custom element for TypeScript
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                'agent-id': string;
            };
        }
    }
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    image?: string
    timestamp: string
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Namaste! I\'m here to help you with WorkBridge. You can ask me about finding workers, job listings, or how to use the platform. I can also analyze images if you upload them!',
            timestamp: new Date().toISOString()
        }
    ])
    const [input, setInput] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, selectedImage])

    // Load ElevenLabs Conversational AI widget
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
        script.async = true
        script.type = 'text/javascript'
        document.body.appendChild(script)

        return () => {
            document.body.removeChild(script)
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                alert('File size too large. Please upload an image smaller than 5MB.')
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                const base64 = e.target?.result as string
                setSelectedImage(base64)
            }
            reader.readAsDataURL(file)
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()

        if ((!input.trim() && !selectedImage) || isLoading) return

        const userMessage: Message = {
            role: 'user',
            content: input,
            image: selectedImage || undefined,
            timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMessage])
        const currentInput = input
        const currentImage = selectedImage

        setInput('')
        setSelectedImage(null)
        setIsLoading(true)

        try {
            // Format history for API (simplified for now, omitting images in history to save tokens)
            const history = messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                content: msg.content
            }))

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentInput || (currentImage ? "Analyze this image" : ""), // Ensure some text exists
                    image: currentImage,
                    history
                })
            })

            if (!response.ok) {
                let errorMsg = `API error (${response.status})`
                try {
                    const errorData = await response.json()
                    errorMsg = errorData.error || errorData.details || errorData.hint || errorMsg
                } catch {
                    const text = await response.text().catch(() => '')
                    errorMsg = text.slice(0, 200) || errorMsg
                }
                console.error('API Error:', errorMsg)
                throw new Error(errorMsg)
            }

            const data = await response.json()

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: data.timestamp
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage: Message = {
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Something went wrong. Please try again.'}`,
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">WorkBridge AI Assistant</h1>
                        <p className="text-sm text-slate-500">{isLoading ? 'Typing...' : 'Always here to help'}</p>
                    </div>
                </div>
            </div>


            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                    ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                    }`}
                            >
                                {message.role === 'user' ? (
                                    <User className="w-5 h-5 text-white" />
                                ) : (
                                    <Bot className="w-5 h-5 text-white" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                                    : 'bg-white text-gray-900 shadow-sm border border-gray-100'
                                    }`}
                            >
                                {message.image && (
                                    <div className="mb-2 max-w-full overflow-hidden rounded-lg">
                                        <img
                                            src={message.image}
                                            alt="Uploaded content"
                                            className="w-full h-auto object-cover max-h-60"
                                        />
                                    </div>
                                )}
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                <p
                                    className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                                        }`}
                                >
                                    {new Date(message.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* ... (Loader) ... */}
                    {isLoading && (
                        <div className="flex gap-3 animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100">
                                <div className="flex gap-1.5">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-slate-100 px-4 py-4 shadow-lg">
                <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
                    {/* Image Preview */}
                    {selectedImage && (
                        <div className="mb-3 relative inline-block">
                            <img
                                src={selectedImage}
                                alt="Preview"
                                className="h-20 w-auto rounded-xl border border-slate-200 shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-100 text-slate-500 rounded-xl p-3 hover:bg-slate-200 transition-all border border-slate-200"
                            title="Upload Image"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || (!input.trim() && !selectedImage)}
                            className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-3 hover:from-blue-700 hover:to-indigo-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>

            {/* ElevenLabs Voice Assistant Widget */}
            <elevenlabs-convai agent-id="agent_3601khh35ay2f67syzxrtq6a5qgp"></elevenlabs-convai>
        </div>
    )
}
