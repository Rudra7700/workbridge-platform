import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')

    // SECURITY: Limit this to local dev or require a secret query param for production
    if (process.env.NODE_ENV !== 'development' && secret !== 'workbridge2026') {
        return NextResponse.json({ error: 'Seeding is only allowed in development or with a valid secret' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const mpLocations = ['Bhopal, MP', 'Indore, MP', 'Jabalpur, MP', 'Gwalior, MP', 'Ujjain, MP']
    const skillsList = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Masonry', 'Welding']

    try {
        console.log("Starting MP Seed Data Generation...")

        // 1. Create a dummy authenticated user if we don't have one to attach things to
        // We'll just generate random UUIDs since RLS might trigger if we don't use real auth users,
        // BUT if we use Service Role Key, it bypasses RLS and we can just insert fake UUIDs.

        let insertedWorkers = 0
        let insertedEmployers = 0
        let insertedJobs = 0

        // Create 10 Worker Profiles
        for (let i = 1; i <= 10; i++) {
            const userId = crypto.randomUUID()
            const location = mpLocations[Math.floor(Math.random() * mpLocations.length)]
            const skills = [skillsList[Math.floor(Math.random() * skillsList.length)], skillsList[Math.floor(Math.random() * skillsList.length)]]

            // Insert Auth (Mocking just the profile to bypass auth creation for raw speed)
            await supabase.from('profiles').insert({
                id: userId,
                name: `Manoj Kumar ${i}`,
                role: 'worker',
                phone: `+9198765432${i.toString().padStart(2, '0')}`,
                rating: (Math.random() * 2 + 3).toFixed(1),
                verified: true,
                aadhaar_verified: true
            })

            // Generate Mock 384d Embedding
            const mockEmbedding = Array(384).fill(0).map(() => Math.random() - 0.5)

            await supabase.from('worker_profiles').insert({
                user_id: userId,
                skills,
                experience: Math.floor(Math.random() * 10) + 1,
                wage_expectation: Math.floor(Math.random() * 500) + 300,
                location: location,
                embedding: mockEmbedding
            })
            insertedWorkers++
        }

        // Create 2 Employers and 5 Jobs
        for (let i = 1; i <= 2; i++) {
            const employerId = crypto.randomUUID()

            await supabase.from('profiles').insert({
                id: employerId,
                name: `Sharma Constructions ${i}`,
                role: 'employer',
                phone: `+9188888888${i.toString().padStart(2, '0')}`,
                rating: 4.5,
                verified: true,
                aadhaar_verified: true
            })
            insertedEmployers++

            for (let j = 1; j <= 3; j++) {
                const location = mpLocations[Math.floor(Math.random() * mpLocations.length)]
                const skill = skillsList[Math.floor(Math.random() * skillsList.length)]
                const mockEmbedding = Array(384).fill(0).map(() => Math.random() - 0.5)

                await supabase.from('jobs').insert({
                    employer_id: employerId,
                    title: `Need urgent ${skill} expert`,
                    description: `हम एक ${skill} की तलाश कर रहे हैं जो ${location} में तुरंत काम शुरू कर सके।`, // Hindi description demo
                    skill_tags: [skill],
                    wage: Math.floor(Math.random() * 500) + 400,
                    location_text: location,
                    status: 'open',
                    embedding: mockEmbedding
                })
                insertedJobs++
            }
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${insertedWorkers} Workers, ${insertedEmployers} Employers, and ${insertedJobs} Jobs directly into the Madhya Pradesh market.`
        })
    } catch (error: any) {
        console.error("Seed error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
