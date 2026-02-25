import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech } from '@/lib/elevenlabs';

// Language detection mapping
const LANGUAGE_KEYWORDS: Record<string, string[]> = {
    'English': ['english', 'inglés', 'angrezhi'],
    'Hindi': ['hindi', 'हिंदी', 'हिन्दी'],
    'Bengali': ['bengali', 'bangla', 'বাংলা'],
    'Tamil': ['tamil', 'தமிழ்'],
    'Telugu': ['telugu', 'తెలుగు'],
    'Marathi': ['marathi', 'मराठी'],
    'Gujarati': ['gujarati', 'ગુજરાતી'],
    'Kannada': ['kannada', 'ಕನ್ನಡ'],
    'Malayalam': ['malayalam', 'മലയാളം'],
    'Punjabi': ['punjabi', 'ਪੰਜਾਬੀ'],
};

function detectLanguage(text: string): string | null {
    const lowerText = text.toLowerCase();

    for (const [language, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
        if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
            return language;
        }
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        const { userMessage, conversationHistory, currentLanguage } = await request.json();

        if (!userMessage) {
            return NextResponse.json(
                { error: 'User message is required' },
                { status: 400 }
            );
        }

        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Detect if user is specifying a language
        const detectedLanguage = detectLanguage(userMessage);
        const activeLanguage = detectedLanguage || currentLanguage || 'English';

        // Build conversation context
        const messages: any[] = [
            {
                role: 'system',
                content: `You are a helpful, friendly AI voice assistant. You are having a natural conversation with the user in ${activeLanguage}. 

Rules:
- Always respond in ${activeLanguage} language
- Keep responses conversational and natural (this is voice conversation)
- Keep responses concise (2-3 sentences max) since they will be spoken
- Be warm, friendly, and helpful
- If the user mentions a language name, acknowledge it and switch to that language
- Don't translate - just converse naturally in the specified language`
            }
        ];

        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            messages.push(...conversationHistory);
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: userMessage
        });

        // Generate AI response
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 150,
        });

        const assistantMessage = completion.choices[0]?.message?.content ||
            (activeLanguage === 'Hindi' ? 'मुझे समझ नहीं आया।' : 'I didn\'t understand that.');

        // Generate audio using ElevenLabs
        let audioUrl: string | null = null;
        try {
            audioUrl = await textToSpeech(assistantMessage, activeLanguage);
        } catch (ttsError) {
            console.warn('ElevenLabs TTS failed:', ttsError);
        }

        return NextResponse.json({
            assistantMessage,
            audioUrl,
            detectedLanguage: activeLanguage,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Voice assistant API error:', error);
        return NextResponse.json(
            { error: 'Assistant failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
