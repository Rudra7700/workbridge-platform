import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { text, targetLanguage } = await request.json();

        if (!text || !targetLanguage) {
            return NextResponse.json(
                { error: 'Text and target language are required' },
                { status: 400 }
            );
        }

        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator. Translate text to ${targetLanguage}. Only provide the translation, nothing else. Maintain the tone and meaning.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
            max_tokens: 500,
        });

        const translation = completion.choices[0]?.message?.content || text;

        return NextResponse.json({
            translation,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Translation API error:', error);
        return NextResponse.json(
            { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
