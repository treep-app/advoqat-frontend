'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToastContext } from '@/components/ui/toast-context'
import { 
  Upload, 
  Camera,
  AlertCircle,
  Loader2,
  Trash2,
  Edit3,
  X
} from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'

interface ProfileImageUploadProps {
  userId: string
  currentImageUrl?: string
  onImageUploaded?: (imageUrl: string) => void
  onImageRemoved?: () => void
}

export function ProfileImageUpload({ 
  userId, 
  currentImageUrl, 
  onImageUploaded, 
  onImageRemoved 
}: ProfileImageUploadProps) {
  const { toast } = useToastContext()
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only JPG and PNG images are allowed.',
        variant: 'destructive'
      })
      return
    }

    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Image size must be less than 5MB.',
        variant: 'destructive'
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    uploadImage(file)
  }

  // Upload image to server
  const uploadImage = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('userId', userId)

      const response = await fetch(API_ENDPOINTS.PROFILE.UPLOAD_IMAGE, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      
      if (data.success) {
        onImageUploaded?.(data.profileImage.url)
        setPreviewUrl(null)
        
        // Refresh navbar profile image
        if (typeof window !== 'undefined') {
          const refreshFn = (window as Window & { refreshNavbarProfileImage?: () => void }).refreshNavbarProfileImage
          if (refreshFn) {
            refreshFn()
          }
        }
        
        toast({
          title: 'Upload Successful',
          description: 'Profile image updated successfully',
          variant: 'success'
        })
      } else {
        // Check if it's a Cloudinary configuration error
        if (data.error && data.error.includes('Cloudinary is not configured')) {
          toast({
            title: 'Upload Disabled',
            description: 'Profile image upload is not configured. Please contact the administrator.',
            variant: 'destructive'
          })
        } else {
          throw new Error(data.error || 'Upload failed')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  // Remove profile image
  const removeImage = async () => {
    setRemoving(true)

    try {
      const response = await fetch(API_ENDPOINTS.PROFILE.REMOVE_IMAGE, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('Remove failed')
      }

      const data = await response.json()
      
      if (data.success) {
        onImageRemoved?.()
        setPreviewUrl(null)
        
        // Refresh navbar profile image
        if (typeof window !== 'undefined') {
          const refreshFn = (window as Window & { refreshNavbarProfileImage?: () => void }).refreshNavbarProfileImage
          if (refreshFn) {
            refreshFn()
          }
        }
        
        toast({
          title: 'Image Removed',
          description: 'Profile image removed successfully',
          variant: 'success'
        })
      } else {
        throw new Error(data.error || 'Remove failed')
      }
    } catch (error) {
      console.error('Remove error:', error)
      toast({
        title: 'Remove Failed',
        description: 'Failed to remove image. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setRemoving(false)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const currentImage = currentImageUrl || previewUrl

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          Profile Picture
        </CardTitle>
        <CardDescription>
          Upload a professional photo for your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Image Display */}
        {currentImage && (
          <div className="relative">
                          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-gray-200">
                <img
                  src={currentImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
              </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={removeImage}
              disabled={removing}
              className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Upload Area */}
        {!currentImage && (
          <div className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-gray-400'
          }`}>
            <div
              className="flex flex-col items-center justify-center space-y-4"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={`p-4 rounded-full transition-colors ${
                isDragOver ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                ) : (
                  <Camera className="h-8 w-8 text-gray-500" />
                )}
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {uploading ? 'Uploading...' : isDragOver ? 'Drop image here' : 'Upload Profile Picture'}
                </h3>
                <p className="text-sm text-gray-500">
                  Drag & drop or click to browse
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">JPG</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">PNG</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">Max 5MB</span>
              </div>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </>
                )}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Replace Image Button */}
        {currentImage && (
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Replace Image
                </>
              )}
            </Button>
            <Button
              onClick={removeImage}
              disabled={removing}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Tips for a great profile picture:</p>
              <ul className="space-y-1">
                <li>• Use a clear, professional photo</li>
                <li>• Ensure good lighting and background</li>
                <li>• Face should be clearly visible</li>
                <li>• Recommended size: 400x400 pixels</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 