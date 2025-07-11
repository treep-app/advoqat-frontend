'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, CheckCircle, ArrowRight } from 'lucide-react'

const legalInterests = [
  {
    id: 'consumer-rights',
    title: 'Consumer Rights',
    description: 'Refunds, warranties, product disputes',
    icon: '🛒',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'employment-law',
    title: 'Employment Law',
    description: 'Workplace disputes, contracts, discrimination',
    icon: '💼',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'tenancy-issues',
    title: 'Tenancy Issues',
    description: 'Rental disputes, landlord problems, deposits',
    icon: '🏠',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'small-claims',
    title: 'Small Claims',
    description: 'Debt collection, contract disputes',
    icon: '⚖️',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'family-law',
    title: 'Family Law',
    description: 'Divorce, custody, support issues',
    icon: '👨‍👩‍👧‍👦',
    color: 'bg-pink-100 text-pink-800'
  },
  {
    id: 'business-law',
    title: 'Business Law',
    description: 'Contracts, partnerships, compliance',
    icon: '🏢',
    color: 'bg-indigo-100 text-indigo-800'
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleContinue = async () => {
    setLoading(true)

    try {
      // Call the onboarding API endpoint
      const response = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          legalInterests: selectedInterests
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save onboarding data')
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (error) {
      console.error('Error during onboarding:', error)
      // Still redirect to dashboard even if there's an error
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Scale className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to LegaliQ!</CardTitle>
          <CardDescription>
            Let&apos;s personalize your experience by selecting your legal interests
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center mb-6">
            <p className="text-gray-600">
              Select the legal areas you&apos;re most interested in. 
              We&apos;ll tailor your experience to provide relevant information and resources.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {legalInterests.map((interest) => (
              <div
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`
                  relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${selectedInterests.includes(interest.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{interest.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {interest.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {interest.description}
                    </p>
                  </div>
                  {selectedInterests.includes(interest.id) && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleContinue}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Setting Up...' : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            You can always update your preferences later in your profile settings.
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 