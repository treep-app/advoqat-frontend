'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ProfileImage } from '@/components/ui/profile-image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { BACKEND_URL } from '@/lib/config'
import {
  Scale,
  Menu,
  Settings,
  LogOut,
  Bell,
  Home,
  FileText,
  MessageSquare,
  ChevronDown,
  Brain,
  Plus,
  CreditCard
} from 'lucide-react'
import { User } from '@supabase/supabase-js'

interface NavbarProps {
  user?: User | null
  currentPage?: string
}

export function Navbar({ user, currentPage }: NavbarProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileImageLoading, setProfileImageLoading] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  // Fetch user's profile image
  const fetchProfileImage = useCallback(async () => {
    if (!user?.id) return

    setProfileImageLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/image/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.profileImage?.url) {
          setProfileImage(data.profileImage.url)
        }
      }
    } catch (error) {
      console.error('Error fetching profile image:', error)
    } finally {
      setProfileImageLoading(false)
    }
  }, [user?.id])

  // Fetch profile image when user changes
  useEffect(() => {
    fetchProfileImage()
  }, [fetchProfileImage])

  // Expose refresh function for other components
  const refreshProfileImage = useCallback(() => {
    console.log('🔄 Refreshing navbar profile image...')
    fetchProfileImage()
  }, [fetchProfileImage])

  // Make refreshProfileImage available globally for other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { refreshNavbarProfileImage?: () => void }).refreshNavbarProfileImage = refreshProfileImage
    }
  }, [refreshProfileImage])

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
      description: 'Overview and quick actions'
    },
    { 
      name: 'AI Assistant', 
      href: '/dashboard/ai-assistant', 
      icon: Brain,
      description: 'Get legal advice instantly'
    },
    { 
      name: 'Documents', 
      href: '/dashboard/documents', 
      icon: FileText,
      description: 'Generate legal documents'
    },
    { 
      name: 'Consultations', 
      href: '/dashboard/consultations', 
      icon: MessageSquare,
      description: 'Connect with lawyers'
    },
    { 
      name: 'Payment History', 
      href: '/dashboard/payment-history', 
      icon: CreditCard,
      description: 'Track transactions and billing'
    },
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: Settings,
      description: 'Manage your account and profile'
    },
  ]

  const isActive = (href: string) => currentPage === href

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  advoqat
                </span>
                <span className="text-xs text-gray-500 font-medium">Legal Assistant</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-colors ${
                    isActive(item.href) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span>{item.name}</span>
                  {isActive(item.href) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Quick Actions */}
            <Button variant="ghost" size="sm" className="relative group">
              <Plus className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative group">
              <Bell className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white">
                3
              </Badge>
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50/80 transition-all duration-200">
                  <ProfileImage 
                    src={profileImage || user?.user_metadata?.avatar_url}
                    name={user?.user_metadata?.full_name || user?.email}
                    size="sm"
                    className={`ring-2 ring-gray-100 ${profileImageLoading ? 'animate-pulse' : ''}`}
                  />
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-900">
                      {user?.user_metadata?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="p-3">
                  <div className="flex items-center space-x-3">
                    <ProfileImage 
                      src={profileImage || user?.user_metadata?.avatar_url}
                      name={user?.user_metadata?.full_name || user?.email}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="p-3 rounded-lg">
                  <Link href="/dashboard" className="flex items-center space-x-3">
                    <Home className="h-4 w-4 text-gray-500" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-3 rounded-lg">
                  <Link href="/dashboard/settings" className="flex items-center space-x-3">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="p-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 rounded-xl hover:bg-gray-50/80">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white/95 backdrop-blur-xl">
                <SheetHeader className="pb-6">
                  <SheetTitle className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl shadow-lg">
                      <Scale className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-gray-900">advoqat</span>
                      <span className="text-xs text-gray-500 font-medium">Legal Assistant</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6">
                  {/* Mobile Navigation */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                      Navigation
                    </h3>
                    {navigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                          }`}
                        >
                          <Icon className={`h-5 w-5 transition-colors ${
                            isActive(item.href) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          <div className="flex-1">
                            <span className="block font-medium">{item.name}</span>
                            <span className="text-xs text-gray-500">{item.description}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  <Separator />

                  {/* Mobile User Section */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                      Account
                    </h3>
                    
                    {/* User Info */}
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50/50 rounded-xl">
                      <ProfileImage 
                        src={profileImage || user?.user_metadata?.avatar_url}
                        name={user?.user_metadata?.full_name || user?.email}
                        size="lg"
                        className="ring-2 ring-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Mobile User Actions */}
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-4 py-3 rounded-xl"
                        onClick={() => {
                          router.push('/dashboard/settings')
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-4 py-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
} 