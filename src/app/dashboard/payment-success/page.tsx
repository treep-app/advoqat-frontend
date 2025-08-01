'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToastContext } from '@/components/ui/toast-context'
import { verifyPaymentSession } from '@/lib/stripe'
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react'
import AddToCalendarButton from '@/components/AddToCalendarButton'

interface ConsultationDetails {
  id: string
  lawyerName: string
  datetime: string
  method: string
}

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToastContext()
  const [loading, setLoading] = useState(true)
  const [consultationDetails, setConsultationDetails] = useState<ConsultationDetails | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      toast({
        title: 'Error',
        description: 'No payment session found',
        variant: 'destructive'
      })
      router.push('/dashboard/consultations')
      return
    }

    // Verify the payment session with the backend
    const verifySession = async () => {
      try {
        setLoading(true)
        const result = await verifyPaymentSession(sessionId)
         console.log("result.metadata", result.metadata)
         console.log("result", result)
        // if (result.paid && result.metadata) {

        if(result){
          setConsultationDetails({
            id: result.metadata.consultationId,
            lawyerName: result.metadata.lawyerName,
            datetime: result.metadata.datetime,
            method: result.metadata.method
          })

         console.log("consultationDetails", consultationDetails)
          
          toast({
            title: 'Payment Successful',
            description: 'Your consultation has been confirmed',
            variant: 'default'
          })
        } else {
          toast({
            title: 'Payment Verification Failed',
            description: 'Please contact support',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        toast({
          title: 'Error',
          description: 'Failed to verify payment. Please contact support.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [searchParams, toast, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl py-8">
        <Card className="w-full max-w-md mx-auto shadow-md">
          <CardHeader className="text-center pb-6 border-b">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Payment Successful</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex flex-col items-center py-8 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                <p className="text-gray-600">Verifying your payment...</p>
              </div>
            ) : consultationDetails ? (
              <>
                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-gray-700">Consultation Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Lawyer:</span> {consultationDetails.lawyerName}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Date & Time:</span> {formatDate(consultationDetails.datetime)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Method:</span> {consultationDetails.method.charAt(0).toUpperCase() + consultationDetails.method.slice(1)} consultation
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-gray-700">Important Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Cancellation Policy:</p>
                      <ul className="text-sm list-disc pl-5 mt-1 space-y-1">
                        <li>A1. User Cancels Before Checkout: If the user backs out before completing payment, the appointment is not confirmed.</li>
                        <li>A2. Payment Fails at Checkout: Appointment is not confirmed, and the system notifies the user of the failure.</li>
                        <li>A3. Lawyer Becomes Unavailable: If the lawyer becomes unavailable after booking, the system notifies the user and offers rescheduling or cancellation.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Postconditions:</p>
                      <ul className="text-sm list-disc pl-5 mt-1 space-y-1">
                        <li>A confirmed voice call appointment is scheduled.</li>
                        <li>Lawyer is responsible for initiating the call at the booked time.</li>
                        <li>Payment is received as part of the booking transaction.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  {/* Add to Calendar Button */}
                  <div className="mb-4 p-3 border border-blue-100 rounded-lg bg-blue-50">
                    <p className="text-sm mb-3 text-blue-700">Don&apos;t forget your appointment! Add it to your calendar:</p>
                    <AddToCalendarButton
                      name={`Legal Consultation with ${consultationDetails.lawyerName}`}
                      description={`Legal consultation via ${consultationDetails.method}. Please be ready 5 minutes before the scheduled time.`}
                      startDate={new Date(consultationDetails.datetime).toISOString().split('T')[0]}
                      startTime={new Date(consultationDetails.datetime).toTimeString().slice(0, 5)}
                      location={consultationDetails.method === 'video' ? 'Video call link will be provided before the meeting' : ''}
                    />
                  </div>
                  
                  <Button 
                    onClick={() => router.push('/dashboard/consultations')}
                    className="w-full"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    View Your Consultations
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600">
                  Could not verify payment details. Please check your consultations page or contact support.
                </p>
                <Button 
                  onClick={() => router.push('/dashboard/consultations')}
                  className="mt-4"
                >
                  Go to Consultations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="container max-w-6xl py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        </div>
      </AppLayout>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
