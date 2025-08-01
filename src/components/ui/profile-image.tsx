'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-react'

interface ProfileImageProps {
  src?: string | null
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function ProfileImage({ 
  src, 
  alt = 'Profile', 
  name, 
  size = 'md',
  className = '' 
}: ProfileImageProps) {
  // Apply Cloudinary transformations if the URL is from Cloudinary
  const getOptimizedImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    
    // If it's a Cloudinary URL, add transformations
    if (url.includes('cloudinary.com')) {
      const baseUrl = url.split('/upload/')[0];
      const publicId = url.split('/upload/')[1];
      return `${baseUrl}/upload/c_fill,g_face,h_400,w_400,f_auto,q_auto/${publicId}`;
    }
    
    return url;
  };
  const getInitials = (name?: string) => {
    if (!name) return 'U'
    
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={getOptimizedImageUrl(src) || undefined} 
        alt={alt}
        className="object-cover"
      />
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        {name ? getInitials(name) : <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  )
} 