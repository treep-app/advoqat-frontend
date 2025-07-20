'use client'

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { ToastProps } from "./use-toast"

interface ToastPropsWithDismiss extends ToastProps {
  onDismiss: (id: string) => void
}

export function Toast({ id, title, description, variant = 'default', onDismiss }: ToastPropsWithDismiss) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(id), 300) // Wait for exit animation
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-500',
          iconComponent: AlertCircle
        }
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'text-green-500',
          iconComponent: CheckCircle
        }
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-500',
          iconComponent: Info
        }
    }
  }

  const styles = getVariantStyles()
  const IconComponent = styles.iconComponent

  return (
    <div
      className={cn(
        'relative w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
        styles.container,
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-5">{title}</h4>
          {description && (
            <p className="mt-1 text-sm leading-4 opacity-90">{description}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-2 h-5 w-5 rounded-md opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function Toaster({ toasts, onDismiss }: { toasts: ToastProps[], onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
} 