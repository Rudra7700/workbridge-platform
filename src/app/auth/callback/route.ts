import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createServerComponentClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if profile exists
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, name')
                    .eq('id', user.id)
                    .single()

                let role = profile?.role || user.user_metadata?.role || 'worker'
                let name = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'

                // If profile doesn't exist, create one
                if (!profile) {
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        name,
                        role,
                        rating: 0,
                        verified: false,
                        aadhaar_verified: false,
                    })

                    if (role === 'worker') {
                        await supabase.from('worker_profiles').upsert({
                            user_id: user.id,
                            skills: [],
                            experience: 0,
                            wage_expectation: 0,
                            location: '',
                            total_earnings: 0,
                            total_jobs: 0,
                        })
                    }
                }

                // IMPORTANT: Ensure the role is in user_metadata for the middleware to pick it up
                if (user.user_metadata?.role !== role) {
                    await supabase.auth.updateUser({
                        data: { role }
                    })
                }

                // Redirect based on role
                const dashboardPath = role === 'employer' ? '/employer/dashboard' : '/worker/dashboard'

                // Use a safe origin for redirection
                const forwardedHost = request.headers.get('x-forwarded-host')
                const isLocalEnv = process.env.NODE_ENV === 'development'

                if (isLocalEnv) {
                    return NextResponse.redirect(`${origin}${dashboardPath}`)
                } else if (forwardedHost) {
                    return NextResponse.redirect(`https://${forwardedHost}${dashboardPath}`)
                } else {
                    return NextResponse.redirect(`${origin}${dashboardPath}`)
                }
            }
        }
    }

    // Fallback redirect to error page if something went wrong
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
