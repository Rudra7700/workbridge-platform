import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { text, targetLang = 'hi' } = await req.json()

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 })
        }

        // Using the free Google Translate API endpoint for hackathon purposes
        // Note: In production, consider a proper paid service like AWS Translate or Google Cloud Translation
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Translation API failed with status ${response.status}`)
        }

        const data = await response.json()

        // The response format from Google's free endpoint is a nested array
        // data[0] contains the translated segments: [[translatedText1, originalText1], [translatedText2, originalText2]]
        let translatedText = ''
        if (data && data[0]) {
            data[0].forEach((segment: any) => {
                if (segment[0]) {
                    translatedText += segment[0]
                }
            })
        } else {
            throw new Error('Unexpected translation response format')
        }

        return NextResponse.json({ translation: translatedText })
    } catch (error: any) {
        console.error('Translation error:', error)
        return NextResponse.json({ error: error.message || 'Failed to translate' }, { status: 500 })
    }
}
