import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { text } = await req.json()

        if (!text) {
            return NextResponse.json({ error: 'Text to embed is required' }, { status: 400 })
        }

        const HF_TOKEN = process.env.HUGGINGFACE_API_KEY
        if (!HF_TOKEN) {
            console.warn("No Hugging Face token found. Returning mock 384-dimensional vector for development.")
            // Generate a deterministic-ish mock vector of length 384
            const mockVector = new Array(384).fill(0).map((_, i) => (Math.sin(text.length + i) * 0.1))
            return NextResponse.json({ embedding: mockVector })
        }

        // Using a fast, standard 384-dimensional embedding model for the hackathon
        const response = await fetch(
            "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({ inputs: text }),
            }
        )

        if (!response.ok) {
            throw new Error(`HF Embedding API responded with ${response.status}`)
        }

        // The API returns an array (the vector)
        const embedding = await response.json()

        // Ensure we send back an array of numbers
        if (!Array.isArray(embedding)) {
            throw new Error("Unexpected embedding format from API")
        }

        return NextResponse.json({ embedding })
    } catch (error: any) {
        console.error('Embedding Generation Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to generate embedding' }, { status: 500 })
    }
}
