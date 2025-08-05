'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Shield, 
  FileText, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  LogOut,
  Bell,
  Lock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { API_ENDPOINTS } from '@/lib/config'
import FreelancerLayout from '@/components/layout/freelancer-layout'

interface FreelancerProfile {
  id: number
  name: string
  email: string
  phone: string
  experience: string
  expertise_areas: string[]
  is_available: boolean
  total_earnings: number
  performance_score: number
  id_card_url?: string
  bar_certificate_url?: string
  additional_documents?: string[]
  created_at: string
  updated_at: string
}

export default function FreelancerSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [profile, setProfile] = useState<FreelancerProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    experience: '',
    expertiseAreas: [] as string[],
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    smsNotifications: false,
    availabilityNotifications: true
  })

  const [credentials, setCredentials] = useState({
    idCard: null as File | null,
    barCertificate: null as File | null,
    additionalDocuments: [] as File[]
  })

  const EXPERTISE_OPTIONS = [
    'Consumer Law',
    'Tenancy Law', 
    'Corporate Law',
    'Family Law',
    'Criminal Law',
    'Employment Law',
    'Intellectual Property',
    'Immigration Law',
    'Other'
  ]

  // Get user ID from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(storedUserId)
      fetchProfile(storedUserId)
    } else {
      // Try to get from Supabase session
      const getUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
          localStorage.setItem('userId', session.user.id)
          fetchProfile(session.user.id)
        } else {
          router.push('/freelancer/login')
        }
      }
      getUser()
    }
  }, [router])

  const fetchProfile = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_ENDPOINTS.FREELANCERS.FREELANCER(id)}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          experience: data.experience || '',
          expertiseAreas: data.expertise_areas || [],
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          emailNotifications: true,
          smsNotifications: false,
          availabilityNotifications: true
        })
      } else {
        setError('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleExpertiseChange = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.includes(expertise)
        ? prev.expertiseAreas.filter(area => area !== expertise)
        : [...prev.expertiseAreas, expertise]
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'barCertificate' | 'additionalDocuments') => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (type === 'additionalDocuments') {
        setCredentials(prev => ({
          ...prev,
          additionalDocuments: [...Array.from(files)]
        }))
      } else {
        setCredentials(prev => ({
          ...prev,
          [type]: files[0]
        }))
      }
    }
  }

  const handleSaveProfile = async () => {
    if (!userId) {
      setError('User ID not found')
      return
    }
    
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch(API_ENDPOINTS.FREELANCERS.UPDATE_PROFILE(userId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          name: formData.name,
          phone: formData.phone,
          experience: formData.experience,
          expertise_areas: formData.expertiseAreas
        })
      })

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        // Refresh profile data
        if (userId) {
          fetchProfile(userId)
        }
      } else {
        setError('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCredentials = async () => {
    if (!userId) {
      setError('User ID not found')
      return
    }
    
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Note: This is a placeholder for file upload
      // In a real implementation, you would upload files to storage first
      const response = await fetch(API_ENDPOINTS.FREELANCERS.UPDATE_CREDENTIALS(userId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          id_card_url: credentials.idCard ? 'placeholder_url' : profile?.id_card_url,
          bar_certificate_url: credentials.barCertificate ? 'placeholder_url' : profile?.bar_certificate_url,
          additional_documents: credentials.additionalDocuments.length > 0 ? ['placeholder_url'] : profile?.additional_documents
        })
      })

      if (response.ok) {
        setSuccess('Credentials updated successfully!')
        // Clear file inputs
        setCredentials({
          idCard: null,
          barCertificate: null,
          additionalDocuments: []
        })
      } else {
        setError('Failed to update credentials')
      }
    } catch (error) {
      console.error('Error updating credentials:', error)
      setError('Failed to update credentials')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Password updated successfully!')
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      }
    } catch (error) {
      console.error('Error updating password:', error)
      setError('Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('userId')
    router.push('/freelancer/login')
  }

  if (loading) {
    return (
      <FreelancerLayout>
        <div className="p-4 md:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-4">Loading Settings...</h1>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </FreelancerLayout>
    )
  }

  return (
    <FreelancerLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your profile, credentials, and preferences</p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Credentials
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and expertise areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Years of Experience</label>
                  <Input
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g., 5 years"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Areas of Expertise</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {EXPERTISE_OPTIONS.map((expertise) => (
                      <div key={expertise} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={expertise}
                          checked={formData.expertiseAreas.includes(expertise)}
                          onChange={() => handleExpertiseChange(expertise)}
                          className="rounded"
                        />
                        <label htmlFor={expertise} className="text-sm">{expertise}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Professional Credentials
                </CardTitle>
                <CardDescription>
                  Upload your professional documents and certifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">ID Card</label>
                  <div className="mt-1">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'idCard')}
                    />
                  </div>
                  {profile?.id_card_url && (
                    <p className="text-sm text-green-600 mt-1">✓ ID card uploaded</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Bar Certificate</label>
                  <div className="mt-1">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'barCertificate')}
                    />
                  </div>
                  {profile?.bar_certificate_url && (
                    <p className="text-sm text-green-600 mt-1">✓ Bar certificate uploaded</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Additional Documents</label>
                  <div className="mt-1">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={(e) => handleFileChange(e, 'additionalDocuments')}
                    />
                  </div>
                  {profile?.additional_documents && profile.additional_documents.length > 0 && (
                    <p className="text-sm text-green-600 mt-1">✓ {profile.additional_documents.length} document(s) uploaded</p>
                  )}
                </div>

                <Button onClick={handleSaveCredentials} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Credentials'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Change your password and manage security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button onClick={handleChangePassword} disabled={saving} className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  {saving ? 'Updating...' : 'Change Password'}
                </Button>

                <Separator />

                <div className="text-center">
                  <Button variant="outline" onClick={handleLogout} className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.smsNotifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Availability Notifications</p>
                      <p className="text-sm text-gray-600">Get notified about availability changes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.availabilityNotifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, availabilityNotifications: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                </div>

                <Button onClick={() => setSuccess('Notification preferences saved!')} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FreelancerLayout>
  )
} 