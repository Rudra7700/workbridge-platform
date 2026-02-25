import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                    }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { conversation_id, amount, worker_id } = await request.json()

    if (!conversation_id || !amount || !worker_id) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // FAKE payment: always succeeds
    const { error: paymentError } = await supabase.from('payments').insert({
        conversation_id,
        amount: Number(amount),
        payer_id: user.id,
        status: 'completed',
    })

    if (paymentError) {
        return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    // Update worker profile earnings
    const { data: wp } = await supabase
        .from('worker_profiles')
        .select('total_earnings, total_jobs')
        .eq('user_id', worker_id)
        .single()

    if (wp) {
        await supabase.from('worker_profiles').update({
            total_earnings: (wp.total_earnings || 0) + Number(amount),
            total_jobs: (wp.total_jobs || 0) + 1,
        }).eq('user_id', worker_id)
    }

    return NextResponse.json({ success: true, message: 'Payment processed (simulated)' })
}
