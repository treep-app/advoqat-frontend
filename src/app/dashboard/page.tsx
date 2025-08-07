'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Scale, 
  MessageCircle, 
  FileText, 
  Users, 
  LogOut, 
  User,
  Settings,
  CreditCard,
  Calendar,
  Briefcase
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import DashboardRoleRedirect from "./DashboardRoleRedirect";
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log(`Getting user:`, user)
        console.log(`Auth error:`, error)
        
        if (error) {
          console.error('Auth error:', error)
          router.push('/auth/signin')
          return
        }
        
        if (!user) {
          console.log('No user found, redirecting to signin')
          router.push('/auth/signin')
          return
        }
        
        console.log('User authenticated:', user.email)
        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('Error getting user:', err)
        router.push('/auth/signin')
      }
    }

    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

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

  return (
    <>
      <DashboardRoleRedirect />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Scale className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Advoqat</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {user?.user_metadata?.full_name || user?.email}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/settings')}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.user_metadata?.full_name || 'User'}! 👋
                </h1>
                <p className="text-gray-600">
                  Ready to get legal assistance? Choose from the options below.
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>AI Legal Assistant</CardTitle>
                    <CardDescription>Get instant legal advice</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Ask any legal question and get AI-powered guidance instantly.
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push('/dashboard/ai-assistant')}
                >
                   Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Document Generator</CardTitle>
                    <CardDescription>Create legal documents</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Generate professional legal documents for common situations.
                </p>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => router.push('/dashboard/documents')}
                >
                  Create Document
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Legal Consultations</CardTitle>
                    <CardDescription>Connect with lawyers</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Book consultations with verified legal professionals. Available 24/7.
                </p>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => router.push('/dashboard/consultations')}
                >
                  Find Lawyer
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Briefcase className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Legal Cases</CardTitle>
                    <CardDescription>Submit & track cases</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Submit legal cases for review and track their progress with assigned lawyers.
                </p>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => router.push('/dashboard/cases')}
                >
                  Submit Case
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <RecentActivity userId={user?.id || ''} />
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Track your transactions and billing records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600 mb-4">View your payment history and transaction details</p>
                  <Button 
                    onClick={() => router.push('/dashboard/payment-history')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    View Payment History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  )
} 