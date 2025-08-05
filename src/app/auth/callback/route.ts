import { API_ENDPOINTS } from '@/lib/config'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
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
              console.log('Error setting cookies')
              console.log(cookiesToSet)
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Sync user to backend
      try {
       
        const syncRes = await fetch(`${API_ENDPOINTS.USERS.SYNC}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseId: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || ''
          })
        })
        
        if (!syncRes.ok) {
          console.log('Failed to sync user to backend:', await syncRes.text())
        } else {
          console.log('User synced to backend successfully')
          // Check user role to determine redirect
          const userData = await syncRes.json()
          if (userData.role === 'freelancer') {
            return NextResponse.redirect(new URL('/freelancer/dashboard', request.url))
          }
        }
      } catch (syncError) {
        console.log('Error syncing user to backend:', syncError)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url))
} 