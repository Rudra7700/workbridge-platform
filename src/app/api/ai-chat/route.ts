import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { messages, role } = await req.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 })
        }

        const HF_TOKEN = process.env.HUGGINGFACE_API_KEY
        if (!HF_TOKEN) {
            console.warn("No Hugging Face token found. Using mock response for development.")
            return NextResponse.json({
                response: `[Mock AI Response for ${role}]: I am a temporary assistant because the HuggingFace API key is missing. How can I help you today?`
            })
        }

        // Role-Aware System Prompting
        const systemPrompt = role === 'employer'
            ? "You are a helpful WorkBridge assistant for an Employer. Answer questions about posting jobs, finding workers, and managing hires. Be concise and professional."
            : "You are a helpful WorkBridge assistant for a Worker. Answer questions about finding jobs, profile building, and getting paid. Speak simply and clearly, knowing they might be translating this to Hindi."

        // Format for Hugging Face Inference API (using a lightweight instruction-tuned model)
        const formattedPrompt = `<|system|>\n${systemPrompt}\n${messages.map((m: any) => `<|${m.role === 'user' ? 'user' : 'assistant'}|>\n${m.content}`).join('\n')}\n<|assistant|>`

        const response = await fetch(
            "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: formattedPrompt,
                    parameters: { max_new_tokens: 150, temperature: 0.7 }
                }),
            }
        )

        if (!response.ok) {
            throw new Error(`HF API responded with ${response.status}`)
        }

        const data = await response.json()
        let aiText = data[0]?.generated_text || "I'm sorry, I couldn't understand that."

        // Clean up the prompt from the generated text
        if (aiText.includes('<|assistant|>')) {
            const parts = aiText.split('<|assistant|>')
            aiText = parts[parts.length - 1].trim()
        }

        return NextResponse.json({ response: aiText })
    } catch (error: any) {
        console.error('AI Chat Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to process chat' }, { status: 500 })
    }
}
