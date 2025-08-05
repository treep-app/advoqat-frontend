'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Freelancer Dashboard Test</h1>
        <p className="text-gray-600">If you can see this, the route is working!</p>
        <p className="text-sm text-gray-500 mt-2">Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
} 