'use client'

import { useToast } from './use-toast'
import { Toaster } from './toaster'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast()

  return (
    <>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </>
  )
} 