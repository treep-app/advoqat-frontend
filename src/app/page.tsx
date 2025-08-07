'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, User, UserCheck, ArrowRight } from "lucide-react";
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is already authenticated, redirect to appropriate dashboard
  if (user) {
    // Check user role and redirect accordingly
    // For now, redirect to regular dashboard
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Advoqat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Scale className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to
              <span className="text-blue-600"> Advoqat</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Choose your account type to get started with legal assistance
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Regular User Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">I'm a Client</CardTitle>
                <CardDescription>
                  Get legal advice, generate documents, and connect with lawyers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    AI-powered legal assistance
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Document generation
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Legal consultations
                  </div>
                </div>
                <div className="space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                    <Link href="/auth/signin">
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/signup">
                      Create Account
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Freelancer/Lawyer Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">I'm a Lawyer</CardTitle>
                <CardDescription>
                  Provide legal services and consultations to clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Manage consultations
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Client communication
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Legal service delivery
                  </div>
                </div>
                <div className="space-y-3">
                  <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <Link href="/freelancer/login">
                      Lawyer Login
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/freelancer/register">
                      Register as Lawyer
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center text-gray-500">
            <p className="text-sm">
              Need help? Contact us at{' '}
              <a href="mailto:support@advoqat.com" className="text-blue-600 hover:underline">
                support@advoqat.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
