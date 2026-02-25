'use client'

import { useEffect } from 'react'

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

export default function VoiceAssistantPage() {

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Voice Assistant</h1>

                <div className="bg-white p-12 rounded-2xl shadow-xl flex flex-col items-center justify-center space-y-6">
                    <div className="w-full flex justify-center">
                        {/* ElevenLabs Widget Container */}
                        <elevenlabs-convai agent-id="agent_3601khh35ay2f67syzxrtq6a5qgp"></elevenlabs-convai>
                    </div>

                    <p className="text-gray-600 mt-4">
                        Click the microphone button above to start talking!
                    </p>
                </div>

                <div className="mt-8 text-sm text-gray-500">
                    <p>Powered by ElevenLabs Conversational AI</p>
                </div>
            </div>
        </div>
    )
}

