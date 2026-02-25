import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { description } = await req.json()

        if (!description) {
            return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
        }

        const HF_TOKEN = process.env.HUGGINGFACE_API_KEY
        if (!HF_TOKEN) {
            // Functional mock fallback for development without keys
            console.warn("No Hugging Face token found. Using mock extraction for development.")
            const descLower = description.toLowerCase()
            const mockSkills = []
            let mockWage = 400

            if (descLower.includes('plumb') || descLower.includes('pipe') || descLower.includes('leak')) { mockSkills.push('Plumbing'); mockWage = 600 }
            if (descLower.includes('electric') || descLower.includes('wire')) { mockSkills.push('Electrical'); mockWage = 650 }
            if (descLower.includes('paint') || descLower.includes('wall')) { mockSkills.push('Painting'); mockWage = 500 }
            if (descLower.includes('clean') || descLower.includes('sweep')) { mockSkills.push('Cleaning'); mockWage = 350 }

            if (mockSkills.length === 0) mockSkills.push('General Labor')

            return NextResponse.json({ skills: mockSkills, suggestedWage: mockWage })
        }

        // AI Processing via Hugging Face Zephyr
        const prompt = `
<|system|>
You are an expert AI for a labor marketplace in Madhya Pradesh (MP), India. 
Extract the core required skills (1 to 3 words each) from the following job description. 
Also, suggest a fair daily wage in INR (₹) for MP. 
Return ONLY a valid JSON object in this exact format: {"skills": ["Skill 1", "Skill 2"], "suggestedWage": numeric_value}
<|user|>
${description}
<|assistant|>`

        const response = await fetch(
            "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: { max_new_tokens: 100, temperature: 0.1 }
                }),
            }
        )

        if (!response.ok) {
            throw new Error(`HF API responded with ${response.status}`)
        }

        const data = await response.json()
        const aiText = data[0]?.generated_text || ""

        // Attempt to parse JSON from the AI output
        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                return NextResponse.json({
                    skills: Array.isArray(parsed.skills) ? parsed.skills : ['Unspecified'],
                    suggestedWage: typeof parsed.suggestedWage === 'number' ? parsed.suggestedWage : 400
                })
            }
        } catch (parseError) {
            console.error("Could not parse LLM output as JSON:", aiText)
        }

        // Fallback if AI fails to return strict JSON formatting
        return NextResponse.json({ skills: ['General Labor'], suggestedWage: 400 })

    } catch (error: any) {
        console.error('Skill extract error:', error)
        return NextResponse.json({ error: error.message || 'Failed to extract skills' }, { status: 500 })
    }
}
