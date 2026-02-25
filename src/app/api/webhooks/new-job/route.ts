import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const payload = await req.json()
        const { job_id, title, location, wage } = payload

        if (!job_id) {
            return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
        }

        // Initialize admin supabase client to bypass RLS for webhook
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch the newly created job
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', job_id)
            .single()

        if (jobError || !job) {
            throw new Error('Job not found')
        }

        // 2. Find matching workers if it has an embedding
        let targetWorkerIds: string[] = []

        if (job.embedding) {
            // Use semantic search to find top 10 matches
            const { data: matches } = await supabase.rpc('match_workers', {
                job_embedding: job.embedding,
                match_threshold: 0.1, // broad match for notifications
                match_count: 10
            })
            if (matches) {
                targetWorkerIds = matches.map((m: any) => m.worker_id)
            }
        } else {
            // Fallback: Notify all workers in the same location (simple match)
            const { data: localWorkers } = await supabase
                .from('worker_profiles')
                .select('user_id')
                .ilike('location', `%${job.location_text}%`)
                .limit(10)

            if (localWorkers) {
                targetWorkerIds = localWorkers.map(w => w.user_id)
            }
        }

        // 3. Fetch Push Tokens for the matched workers
        if (targetWorkerIds.length > 0) {
            const { data: tokens } = await supabase
                .from('worker_push_tokens')
                .select('token, user_id')
                .in('user_id', targetWorkerIds)

            if (tokens && tokens.length > 0) {
                // FAKE: Simulate sending push notifications to FCM / APNS
                console.log(`[PUSH NOTIFICATION DISPATCHER] Sending notifications to ${tokens.length} devices!`)
                console.log(`Push Payload: "New Job: ${job.title} in ${job.location_text} paying ₹${job.wage}"`)
                tokens.forEach(t => console.log(`-> Sending to token: ${t.token} (User: ${t.user_id})`))
            } else {
                console.log("[PUSH NOTIFICATION DISPATCHER] Matches found, but none have registered push tokens.")
            }
        } else {
            console.log("[PUSH NOTIFICATION DISPATCHER] No relevant workers found for this job.")
        }

        return NextResponse.json({ success: true, processed: true, matchedWorkers: targetWorkerIds.length })

    } catch (error: any) {
        console.error('Webhook processing error:', error)
        return NextResponse.json({ error: error.message || 'Webhook failed' }, { status: 500 })
    }
}
