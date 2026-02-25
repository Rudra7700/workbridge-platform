import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Define CSP policies
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://*.elevenlabs.io;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https://*.supabase.co;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://*.supabase.co https://*.nvidia.com https://integrate.api.nvidia.com https://*.elevenlabs.io wss://*.elevenlabs.io;
        frame-src 'self';
        object-src 'none';
    `.replace(/\s{2,}/g, ' ').trim()

    response.headers.set('Content-Security-Policy', cspHeader)

    // IMPORTANT: Avoid using getUser() if you only need the session, but here we need user_metadata
    // getUser() is more secure as it re-validates the JWT with Supabase Auth
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Define public routes
    const isPublicRoute =
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/auth-code-error' ||
        pathname.startsWith('/auth/callback')

    if (!user && !isPublicRoute) {
        // For API routes, return 401 instead of redirecting
        // This prevents 405 Method Not Allowed errors when the browser follows a redirect for a POST request
        if (pathname.startsWith('/api')) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You must be logged in to access this resource' },
                { status: 401 }
            )
        }

        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user) {
        // Use role from user_metadata instead of a database query
        // This is much faster and more reliable under load
        const role = user.user_metadata?.role

        // Redirect /dashboard to role-specific dashboard
        if (pathname === '/dashboard') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'employer' ? '/employer/dashboard' : '/worker/dashboard'
            return NextResponse.redirect(url)
        }

        // Prevent cross-role access
        if (pathname.startsWith('/employer') && role !== 'employer') {
            const url = request.nextUrl.clone()
            url.pathname = '/worker/dashboard'
            return NextResponse.redirect(url)
        }

        if (pathname.startsWith('/worker') && role !== 'worker') {
            const url = request.nextUrl.clone()
            url.pathname = '/employer/dashboard'
            return NextResponse.redirect(url)
        }

        // Redirect logged-in users away from auth pages
        if (pathname === '/login' || pathname === '/signup') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'employer' ? '/employer/dashboard' : '/worker/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return response
}
