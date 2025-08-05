import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Handle email verification redirects
  if (request.nextUrl.pathname === '/auth/callback') {
    const code = request.nextUrl.searchParams.get('code')
    const next = request.nextUrl.searchParams.get('next') || '/auth/onboarding'
    
    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
    }
    
    return NextResponse.redirect(new URL(next, request.url))
  }

  // Only redirect to signin if user is not authenticated and trying to access protected routes
  // Allow client-side to handle authentication state for better UX
  if (request.nextUrl.pathname === '/dashboard' || request.nextUrl.pathname.startsWith('/freelancer/dashboard')) {
    // Let the dashboard pages handle their own authentication check
    // This prevents redirect loops and allows for better loading states
    return response
  }

  // Allow authenticated users to access the landing page
  // (The landing page will show different UI based on auth state)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 