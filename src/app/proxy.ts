import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    const isPublicRoute =
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/auth-code-error' ||
        pathname.startsWith('/auth/callback') ||
        pathname.startsWith('/api/seed') ||
        pathname.startsWith('/api/ping') ||
        pathname.startsWith('/api/webhooks')

    if (isPublicRoute) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }

    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = await import('@supabase/ssr').then(m => 
        m.createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session && pathname.startsWith('/api')) {
        return NextResponse.json(
            { error: 'Unauthorized', message: 'You must be logged in to access this resource' },
            { status: 401 }
        )
    }

    if (!session) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (session && pathname === '/dashboard') {
        const url = request.nextUrl.clone()
        url.pathname = '/employer/dashboard'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
