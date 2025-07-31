'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { AppLayout } from '@/components/layout/app-layout'
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToastContext } from '@/components/ui/toast-context'
import { 
  User, 
  Shield, 
  Bell, 
  Settings,
  Save,
  Edit3
} from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  profile_image_url?: string
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { toast } = useToastContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })

  // Get user and fetch profile
  const getUserAndProfile = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        console.error('Auth error:', error)
        return
      }
      
      setUser(user)
      
      // Fetch profile data
      const response = await fetch(`${API_ENDPOINTS.USERS.PROFILE}?userId=${user.id}`)

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.profile) {
          setProfile(data.profile)
          setFormData({
            name: data.profile.name || '',
            phone: data.profile.phone || '',
            address: data.profile.address || ''
          })
        } else {
          // If no profile exists yet, create a basic one
          setProfile({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || '',
            phone: '',
            address: '',
            profile_image_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          setFormData({
            name: user.user_metadata?.full_name || '',
            phone: '',
            address: ''
          })
        }
      } else {
        // If response is not ok, create a basic profile from user data
        setProfile({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
          phone: '',
          address: '',
          profile_image_url: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        setFormData({
          name: user.user_metadata?.full_name || '',
          phone: '',
          address: ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // If profile fetch fails, create a basic profile from user data
      if (user) {
        setProfile({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
          phone: '',
          address: '',
          profile_image_url: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        setFormData({
          name: user.user_metadata?.full_name || '',
          phone: '',
          address: ''
        })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getUserAndProfile()
  }, [getUserAndProfile])

  // Handle form changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Save profile changes
  const saveProfile = async () => {
    if (!user?.id) return

    setSaving(true)

    try {
      const response = await fetch(API_ENDPOINTS.USERS.UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData
        })
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setIsEditing(false)
        
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully',
          variant: 'success'
        })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle image upload
  const handleImageUploaded = (imageUrl: string) => {
    setProfile(prev => prev ? { ...prev, profile_image_url: imageUrl } : null)
  }

  // Handle image removal
  const handleImageRemoved = () => {
    setProfile(prev => prev ? { ...prev, profile_image_url: undefined } : null)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-2">Manage your account settings and profile</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {user?.email}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Image Section */}
            <div>
              <ProfileImageUpload
                userId={user?.id || ''}
                currentImageUrl={profile?.profile_image_url}
                onImageUploaded={handleImageUploaded}
                onImageRemoved={handleImageRemoved}
              />
            </div>

            {/* Profile Information Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter your full name"
                      />
                      {!isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      Email address cannot be changed
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your address"
                    />
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={saveProfile}
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          // Reset form data to original values
                          setFormData({
                            name: profile?.name || '',
                            phone: profile?.phone || '',
                            address: profile?.address || ''
                          })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Your account details and membership information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Member Since</p>
                      <p className="font-medium">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-medium">
                        {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-gray-500">Active</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Verified
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Additional Settings
              </CardTitle>
              <CardDescription>
                Manage notifications and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive updates about consultations and documents</p>
                    </div>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Privacy Settings</p>
                      <p className="text-sm text-gray-500">Control who can see your profile information</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
} 