'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bell, Scale, User, Clock, LogOut, Menu, ChevronLeft, DollarSign, Circle, MessageCircle, FileText, Star, Settings, Plus, RefreshCw, Search, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FreelancerLayoutProps {
  children: React.ReactNode
  currentPage?: string
}

export default function FreelancerLayout({ children }: FreelancerLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availability, setAvailability] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    console.log('FreelancerLayout useEffect running')
    
    // Get userId from localStorage or Supabase session
    const getUserId = async () => {
      try {
        // First try localStorage
        const storedUserId = localStorage.getItem('userId')
        if (storedUserId) {
          console.log('Found userId in localStorage:', storedUserId)
          setUserId(storedUserId)
          setLoading(false)
          return
        }

        // If not in localStorage, try to get from Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('Found user in Supabase session:', session.user.id)
          setUserId(session.user.id)
          localStorage.setItem('userId', session.user.id)
          setLoading(false)
          return
        }

        // If no session, redirect to login
        console.log('No user found, redirecting to login')
        router.push('/freelancer/login')
      } catch (error) {
        console.error('Error getting userId:', error)
        setLoading(false)
      }
    }

    getUserId()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('userId')
    router.push('/freelancer/login')
  }

  const isActivePage = (page: string) => {
    return pathname.includes(page)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Loading Dashboard...</h1>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <Button onClick={() => router.push('/freelancer/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Debug info */}
      <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white p-2 rounded">
        Debug: Dashboard loaded, userId: {userId}
      </div>

      {/* Sidebar */}
      <aside className={`fixed z-40 md:static md:translate-x-0 top-0 left-0 h-full w-64 bg-white border-r flex flex-col py-6 px-4 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center gap-2 mb-8">
          <Scale className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">advoqat</span>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Button 
            variant={isActivePage('/freelancer/dashboard') && !isActivePage('/settings') ? "default" : "ghost"} 
            className="w-full justify-start font-semibold"
            onClick={() => router.push('/freelancer/dashboard')}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline h-5 w-5 mr-2 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 2v6m0 0h4m-4 0a2 2 0 01-2-2v-4m6 6v-6m0 0l2 2m-2-2l-2 2" />
            </svg>
            Home
          </Button>
          <Button 
            variant={isActivePage('/cases') ? "default" : "ghost"} 
            className="w-full justify-start flex items-center"
            onClick={() => router.push('/freelancer/dashboard/cases')}
          >
            <Clock className="h-5 w-5 mr-2" /> Case Inbox
          </Button>
          <Button 
            variant={isActivePage('/bookings') ? "default" : "ghost"} 
            className="w-full justify-start flex items-center"
            onClick={() => router.push('/freelancer/dashboard/bookings')}
          >
            <Calendar className="h-5 w-5 mr-2" /> Bookings
          </Button>
          <Button variant="ghost" className="w-full justify-start flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" /> Chat
          </Button>
          <Button variant="ghost" className="w-full justify-start flex items-center">
            <FileText className="h-5 w-5 mr-2" /> Document Annotator
          </Button>
          <Button variant="ghost" className="w-full justify-start flex items-center">
            <User className="h-5 w-5 mr-2" /> Profile & Credentials
          </Button>
          <Button 
            variant={isActivePage('/payments') ? "default" : "ghost"} 
            className="w-full justify-start flex items-center"
            onClick={() => router.push('/freelancer/dashboard/payments')}
          >
            <DollarSign className="h-5 w-5 mr-2" /> Payments
          </Button>
          <Button variant="ghost" className="w-full justify-start flex items-center">
            <Star className="h-5 w-5 mr-2" /> Ratings & Feedback
          </Button>
          <Button 
            variant={isActivePage('/settings') ? "default" : "ghost"} 
            className="w-full justify-start flex items-center"
            onClick={() => router.push('/freelancer/dashboard/settings')}
          >
            <Settings className="h-5 w-5 mr-2" /> Settings
          </Button>
        </nav>
        
        <div className="mt-8 flex items-center gap-2">
          <User className="h-5 w-5 text-gray-600" />
          <span className="text-sm text-gray-700">Sarah Johnson, Esq.</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white border-b px-4 md:px-8 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-blue-600" />
            </Button>
            <div className="text-2xl font-bold text-blue-700">
              {isActivePage('/settings') ? 'Settings' : 'Home'}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon"><Search className="h-5 w-5 text-gray-500" /></Button>
            <Button variant="ghost" size="icon"><Plus className="h-5 w-5 text-blue-600" /></Button>
            <Button variant="ghost" size="icon"><RefreshCw className="h-5 w-5 text-gray-500" /></Button>
            <Button 
              variant={availability ? "outline" : "default"} 
              size="sm" 
              className={`transition-all duration-200 ${
                availability 
                  ? "text-green-700 border-green-200 bg-green-50 shadow-lg scale-105" 
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`} 
              disabled={availabilityLoading}
            >
              <Circle className={`h-4 w-4 mr-1 ${availability ? "text-green-500" : "text-gray-400"}`} />
              {availabilityLoading ? "Updating..." : availability ? "Available" : "Offline"}
            </Button>
            <div className="relative">
              <Button variant="ghost" onClick={() => setShowNotifications(v => !v)} className="relative">
                <Bell className="h-6 w-6 text-blue-600" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
} 