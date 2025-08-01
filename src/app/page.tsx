'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [redirectAttempted, setRedirectAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to redirect after a short delay
    const timer = setTimeout(() => {
      try {
        setRedirectAttempted(true)
        router.push('/auth/signin')
      } catch (err) {
        setError('Redirect failed')
        console.error('Redirect error:', err)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [router])

  // Show a simple loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">Redirecting to sign in...</p>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm mb-2">Error: {error}</p>
          </div>
        )}
        
        {/* Fallback link in case redirect doesn't work */}
        {redirectAttempted && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">If you're not redirected automatically:</p>
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Click here to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
