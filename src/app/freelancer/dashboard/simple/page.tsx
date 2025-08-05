'use client'

import { useEffect } from 'react'

export default function SimpleDashboard() {
  useEffect(() => {
    console.log('Simple dashboard loaded')
  }, [])

  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Simple Dashboard Works!</h1>
        <p className="text-gray-600">The redirect is working correctly.</p>
        <p className="text-sm text-gray-500 mt-2">Current time: {new Date().toLocaleString()}</p>
        <p className="text-sm text-gray-500">User ID from localStorage: {typeof window !== "undefined" ? localStorage.getItem("userId") : "Not available"}</p>
      </div>
    </div>
  )
} 