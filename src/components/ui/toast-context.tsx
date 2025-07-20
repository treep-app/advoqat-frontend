'use client'

import React, { createContext, useContext } from 'react'
import { useToast } from './use-toast'

const ToastContext = createContext<ReturnType<typeof useToast> | null>(null)

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastContextProvider')
  }
  return context
} 