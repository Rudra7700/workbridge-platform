import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { text, language = 'hi' } = await req.json()

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 })
        }

        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
        if (!ELEVENLABS_API_KEY) {
            return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
        }

        // Using a multilingual voice capable of Hindi (e.g. "Rachel" or "Aarti")
        const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('ElevenLabs Error:', errorData)
            throw new Error('Failed to generate audio')
        }

        const audioBuffer = await response.arrayBuffer()

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'attachment; filename="speech.mp3"',
            },
        })
    } catch (error: any) {
        console.error('TTS error:', error)
        return NextResponse.json({ error: error.message || 'Failed to generate speech' }, { status: 500 })
    }
}
