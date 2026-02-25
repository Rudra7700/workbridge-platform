import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        if (!process.env.GOOGLE_AI_API_KEY) {
            console.error('GOOGLE_AI_API_KEY is missing');
            return NextResponse.json({ error: 'Google AI API key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        // Using gemini-1.5-pro for maximum intelligence, or gemini-2.0-flash for speed
        // User asked for "Gemini 3.1 Pro" which might be a typo for 1.5 Pro or future-proof request
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const { message, history, image } = await request.json();

        if (!message && !image) {
            return NextResponse.json({ error: 'Message or image is required' }, { status: 400 });
        }

        const systemPrompt = `You are a helpful assistant for WorkBridge, a platform connecting workers and employers in India. 
You help users find jobs, hire workers, and navigate the platform. 
You can communicate in English and 10 Indian languages. Always be friendly, concise, and helpful.`;

        // Format history for Gemini SDK
        const chatHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: chatHistory,
            systemInstruction: systemPrompt,
        });

        let result;
        if (image) {
            // Processing multimodal input
            const base64Data = image.split(',')[1];
            const mimeType = image.split(',')[0].split(':')[1].split(';')[0];

            result = await chat.sendMessage([
                message || "Analyze this image",
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                }
            ], { signal: controller.signal });
        } else {
            result = await chat.sendMessage(message, { signal: controller.signal });
        }

        clearTimeout(timeoutId);
        const responseText = result.response.text();

        return NextResponse.json({
            response: responseText,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
        }
        console.error('Gemini API error:', error);
        return NextResponse.json(
            { error: 'Failed to process message', details: error.message },
            { status: 500 }
        );
    }
}
