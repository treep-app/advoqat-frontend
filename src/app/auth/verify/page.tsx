'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function VerifyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  // Check if user is already verified
  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email_confirmed_at) {
        // User is already verified, redirect to onboarding
        router.push('/auth/onboarding')
      }
    }
    
    checkUserStatus()
  }, [router])



  const handleResendEmail = async () => {
    setIsResending(true)
    setError('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Verification email sent again! Please check your inbox.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleSkipVerification = () => {
    // Allow users to proceed to onboarding even without verification
    // This is useful for development or if email verification is optional
    router.push('/auth/onboarding')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Scale className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to your email address
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Mail className="h-16 w-16 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Check Your Email</h3>
              <p className="text-gray-600">
                We&apos;ve sent a verification link to:
                <br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Click the verification link in your email</p>
                <p>• Check your spam folder if you don&apos;t see it</p>
                <p>• The link will expire in 24 hours</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>

                <Button
                  onClick={handleSkipVerification}
                  variant="ghost"
                  className="w-full text-gray-600"
                >
                  Continue to Onboarding
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            <Link href="/auth/signin" className="flex items-center justify-center gap-2 text-blue-600 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyPageInner />
    </Suspense>
  );
} 