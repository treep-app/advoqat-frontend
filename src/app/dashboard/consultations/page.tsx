'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AddToCalendarButton from "@/components/AddToCalendarButton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToastContext } from '@/components/ui/toast-context'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { API_ENDPOINTS } from '@/lib/config'
import { 
  Search, 
  Calendar, 
  Clock, 
  Video, 
  MessageCircle, 
  Star, 
  Award, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Filter,
  SortAsc,
  MessageSquare,
  ThumbsUp,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  UserCheck,
  TrendingUp,
  CalendarDays,
  Clock4,
  Video as VideoIcon,
  MessageSquare as MessageSquareText,
  RefreshCw,
  Phone,
  Info,
  Check
} from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'

// Types
interface Lawyer {
  id: string | number
  name: string
  user_id?: string | number // Backend uses this as the lawyerId in booking API
  specialty?: string[]
  expertise_areas?: string[] // New field for expertise areas
  email?: string
  phone?: string
  experience?: number
  performance_score?: number | string
  is_available?: boolean
  is_verified?: boolean
  verification_status?: string
  avatarUrl?: string
  id_card_url?: string
  bar_certificate_url?: string
  availability?: string[]
}

interface Consultation {
  id: string | number
  lawyerName: string
  datetime: string
  method: string
  status: string
  roomUrl?: string
  notes?: string
}

interface ConsultationApiResponse {
  id: string | number
  lawyerName?: string
  datetime?: string
  scheduled_at?: string
  method?: string
  status?: string
  roomUrl?: string
  room_url?: string
  notes?: string
  freelancer_name?: string
  base_fee?: number
  additional_fee?: number
  total_fee?: number
  instructions?: string
}

export default function LegalConsultations() {
  const router = useRouter()
  const { toast } = useToastContext()
  const [tab, setTab] = useState('find') // Default to 'find' to show Find a Lawyer first
  const [lawyerSearch, setLawyerSearch] = useState('')
  const [showBooking, setShowBooking] = useState(false)
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null)
  const [showLawyerProfile, setShowLawyerProfile] = useState(false)
  const [bookingStep, setBookingStep] = useState<'details' | 'review' | 'payment' | 'confirmation'>('details')
  const [consultationFees, setConsultationFees] = useState<{
    base_fee: number;
    additional_fee: number;
    total_fee: number;
  } | null>(null)
  const [profileLawyer, setProfileLawyer] = useState<Lawyer | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [showFindLawyer, setShowFindLawyer] = useState(false)
  const [savedPaymentJourney, setSavedPaymentJourney] = useState<{
    selectedLawyer: Lawyer;
    bookingDate: string;
    bookingTime: string;
    bookingMethod: string;
    bookingNotes: string;
    totalFee: number;
  } | null>(null)


  // Form states
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingMethod, setBookingMethod] = useState('video')
  const [bookingNotes, setBookingNotes] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackComments, setFeedbackComments] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  
  // Stripe checkout modal state


  // Data states
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loadingLawyers, setLoadingLawyers] = useState(true)
  const [loadingConsultations, setLoadingConsultations] = useState(true)
  const [lawyersError, setLawyersError] = useState<string | null>(null)
  const [consultationsError, setConsultationsError] = useState<string | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const hasFetchedConsultations = useRef(false)
  const userRef = useRef<SupabaseUser | null>(null)

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        router.push('/auth/signin')
        return
      }
      setUser(data.user)
      userRef.current = data.user
    }
    getUser()
  }, [router])

  // Fetch lawyers
  useEffect(() => {
    setLoadingLawyers(true)
    setLawyersError(null)
    fetch(API_ENDPOINTS.FREELANCERS.LIST)
      .then(res => res.json())
      .then(data => {
        setLawyers(Array.isArray(data) ? data : [])
      })
      .catch(() => setLawyersError('Failed to load lawyers.'))
      .finally(() => setLoadingLawyers(false))
  }, [])

  // Fetch consultations
  const fetchConsultations = useCallback(async () => {
    const currentUser = userRef.current
    if (!currentUser) {
      console.log('No current user, skipping consultation fetch')
      return
    }
    
    setLoadingConsultations(true)
    setConsultationsError(null)
    
    try {
      const url = `${API_ENDPOINTS.CONSULTATIONS.MY_CONSULTATIONS}?userId=${currentUser.id}`
      console.log('Fetching consultations from URL:', url)
      console.log('Fetching consultations for user:', currentUser.id)
      
      const response = await fetch(url)
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      let data
      try {
        data = await response.json()
        console.log('Consultations API response:', data)
        console.log('Response type:', typeof data)
        console.log('Is array:', Array.isArray(data))
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError)
        throw new Error('Failed to parse server response')
      }
      
      // Ensure data is an array and process each consultation
      const processedConsultations = Array.isArray(data) ? data
        .map((consultation: ConsultationApiResponse) => {
          console.log('Processing consultation:', consultation)
          return {
            id: consultation.id,
            lawyerName: consultation.lawyerName || consultation.freelancer_name || 'Unknown Lawyer',
            datetime: consultation.datetime || consultation.scheduled_at || new Date().toISOString(),
            method: consultation.method || 'video',
            status: consultation.status || 'pending',
            roomUrl: consultation.roomUrl || consultation.room_url,
            notes: consultation.notes || ''
          }
        })
        .filter(consultation => {
          const isValid = consultation.id && consultation.lawyerName
          console.log('Consultation valid:', isValid, consultation)
          return isValid
        }) : []
      
      console.log('Processed consultations:', processedConsultations)
      setConsultations(processedConsultations)
    } catch (error) {
      console.error('Error fetching consultations:', error)
      setConsultationsError(error instanceof Error ? error.message : 'Failed to load consultations.')
    } finally {
      setLoadingConsultations(false)
    }
  }, [])

  useEffect(() => {
    if (user && !hasFetchedConsultations.current) {
      hasFetchedConsultations.current = true
      fetchConsultations()
    }
  }, [user, fetchConsultations])

  // Payment persistence functions
  const savePaymentJourney = (journeyData: {
    selectedLawyer: Lawyer;
    bookingDate: string;
    bookingTime: string;
    bookingMethod: string;
    bookingNotes: string;
    totalFee: number;
  }) => {
    const journey = {
      ...journeyData,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    localStorage.setItem('legaliq_payment_journey', JSON.stringify(journey))
    setSavedPaymentJourney(journey)
  }

  const loadPaymentJourney = () => {
    const saved = localStorage.getItem('legaliq_payment_journey')
    if (saved) {
      const journey = JSON.parse(saved)
      // Check if journey is still valid (not expired)
      if (journey.expiresAt > Date.now()) {
        setSavedPaymentJourney(journey)
        return journey
      } else {
        // Clear expired journey
        localStorage.removeItem('legaliq_payment_journey')
        setSavedPaymentJourney(null)
      }
    }
    return null
  }

  const clearPaymentJourney = () => {
    localStorage.removeItem('legaliq_payment_journey')
    setSavedPaymentJourney(null)
  }

  const continuePaymentJourney = async (journey: {
    selectedLawyer: Lawyer;
    bookingDate: string;
    bookingTime: string;
    bookingMethod: string;
    bookingNotes: string;
    totalFee: number;
    consultationFees?: {
      base_fee: number;
      additional_fee: number;
      total_fee: number;
    };
  }) => {
    try {
      setBookingLoading(true)
      
      // Restore booking state
      setSelectedLawyer(journey.selectedLawyer)
      setBookingDate(journey.bookingDate)
      setBookingTime(journey.bookingTime)
      setBookingMethod(journey.bookingMethod)
      setBookingNotes(journey.bookingNotes)
      if (journey.consultationFees) {
        setConsultationFees(journey.consultationFees)
      }
      setBookingStep('review')
      setShowBooking(true)
      
      // Clear the saved journey since we're continuing it
      clearPaymentJourney()
      
      toast({
        title: "Payment Journey Restored",
        description: "Your booking details have been restored. You can continue with payment.",
      })
    } catch (error) {
      console.error('Error continuing payment journey:', error)
      toast({
        title: 'Error',
        description: 'Could not restore payment journey. Please start a new booking.',
        variant: 'destructive'
      })
    } finally {
      setBookingLoading(false)
    }
  }

  // Handle payment success redirect from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const sessionId = urlParams.get('session_id')
    
    if (paymentStatus === 'success' && sessionId) {
      // Show success message
      toast({
        title: "Payment Successful",
        description: "Your consultation has been booked and paid for.",
      })
      
      // Clear any saved payment journey
      clearPaymentJourney()
      
      // Reset booking state
      setShowBooking(false)
      setSelectedLawyer(null)
      setBookingDate('')
      setBookingTime('')
      setBookingMethod('')
      setBookingNotes('')
      setBookingStep('details')
      
      // Refresh consultations
      fetchConsultations()
      
      // Clear URL parameters
      window.history.replaceState({}, '', '/dashboard/consultations')
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled. You can continue later from your saved booking.',
        variant: 'destructive'
      })
      
      // Clear URL parameters
      window.history.replaceState({}, '', '/dashboard/consultations')
    }
  }, [fetchConsultations, toast])

  // Check for saved payment journey on component mount
  useEffect(() => {
    const journey = loadPaymentJourney()
    if (journey) {
      // Journey loaded, but we don't need to show persistence UI anymore
    }
  }, [])

  // Handle booking step navigation
  const handleNextStep = async () => {
    if (bookingStep === 'details') {
      if (!selectedLawyer || !bookingDate || !bookingTime) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        })
        return
      }
      
      setBookingLoading(true)
      
      try {
        // For voice calls, fetch pricing information
        if (bookingMethod === 'voice') {
          // In a real implementation, this would call an API endpoint to get pricing
          // For now we'll simulate with static values
          setConsultationFees({
            base_fee: 50,
            additional_fee: 10,
            total_fee: 60
          })
        } else {
          // For other consultation types, set default pricing
          setConsultationFees({
            base_fee: 40,
            additional_fee: 0,
            total_fee: 40
          })
        }
        
        setBookingStep('review')
      } catch (error) {
        console.error('Error getting consultation fees:', error)
        toast({
          title: 'Error',
          description: 'Could not fetch consultation pricing. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setBookingLoading(false)
      }
    } else if (bookingStep === 'review') {
      // Proceed directly to Stripe payment without going to payment summary
      setBookingLoading(true)
      try {
        // Submit booking and trigger Stripe checkout
        await handleSubmitBooking()
        // Note: We don't need to set booking loading to false here as the page will redirect
      } catch (error) {
        console.error('Booking/payment error:', error)
        toast({
          title: 'Payment Failed',
          description: 'There was an issue processing your booking. Please try again.',
          variant: 'destructive'
        })
        setBookingLoading(false)
      }
    }
  }
  
  // Go back to previous step
  const handlePreviousStep = () => {
    if (bookingStep === 'review') {
      setBookingStep('details')
    } else if (bookingStep === 'confirmation') {
      // Reset the whole process
      handleCancelBooking()
    }
    // Payment step is now removed, handled directly in Stripe checkout
  }
  
  // States for cancel confirmation dialog
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Show cancel confirmation
  const showCancelConfirmation = () => {
    setShowCancelConfirm(true)
  }

  // Handle confirmed cancellation
  const handleCancelBookingConfirmed = () => {
    // Reset booking form and close dialog
    setBookingStep('details')
    setBookingDate(new Date().toISOString().split('T')[0])
    setBookingTime('')
    setBookingMethod('video')
    setBookingNotes('')
    setShowBooking(false)
    setConsultationFees(null)
    setBookingLoading(false)
    setShowCancelConfirm(false) // Close confirmation dialog
  }

  // Handle cancellation - now shows confirmation first
  const handleCancelBooking = () => {
    showCancelConfirmation()
  }

  // Book consultation (final submission)
  const handleSubmitBooking = async () => {
    try {
      setBookingLoading(true);
      
      // Use existing user state
      if (!user || !selectedLawyer) {
        toast({
          title: "Error",
          description: "Unable to complete booking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Format date and time for API
      const bookingDatetime = `${bookingDate}T${bookingTime}:00`;
      
      // Validate the date is valid
      const dateObj = new Date(bookingDatetime);
      if (isNaN(dateObj.getTime())) {
        toast({
          title: "Invalid Date",
          description: "Please select a valid date and time for the consultation.",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare request payload with additional fields and validation
      const payload = {
        userId: user.id, // Include userId in the request
        clientId: user.id, // Some APIs expect clientId instead of userId
        lawyerId: selectedLawyer?.user_id || selectedLawyer?.id, // Backend expects user_id, not id
        datetime: bookingDatetime,
        date: bookingDate, // Add date separately
        time: bookingTime, // Add time separately
        method: bookingMethod || 'video', // Provide default
        notes: bookingNotes || '',
        status: 'pending' // Add status field
      };
      
      // Validation
      if (!payload.lawyerId) {
        throw new Error("Lawyer information is missing");
      }
      
      if (!bookingDate || !bookingTime) {
        throw new Error("Please select both date and time for the consultation");
      }
      
      console.log("Booking payload:", payload);
      
      // Do NOT convert lawyerId to a number since it could be a user ID string
      // The backend controller looks for a user_id, which might be a string
      // Keep the lawyerId as-is to preserve its correct format
      console.log("Selected lawyer full object:", selectedLawyer);
      
      // Log the exact format we're sending
      console.log("Sending formatted payload:", JSON.stringify(payload));
      
      // Call API to book consultation - matching Postman request exactly
      const response = await fetch(`${API_ENDPOINTS.CONSULTATIONS.BOOK}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
          // Authorization header removed as per your Postman test
        },
        body: JSON.stringify(payload)
      });
      
      // Log response for debugging
      console.log("Booking response status:", response.status);

      if (!response.ok) {
        // Try to get detailed error information
        try {
          // Clone the response to read it twice
          const responseClone = response.clone();
          // Try to get the response as text first
          const responseText = await responseClone.text();
          console.error("API response text:", responseText);
          
          try {
            // Then try to parse as JSON if possible
            const errorData = JSON.parse(responseText);
            console.error("API error details:", errorData);
            throw new Error(errorData.message || errorData.error || "Failed to book consultation");
          } catch (jsonError) {
            // If JSON parsing fails, use the text response
            console.error("JSON parse error:", jsonError);
            throw new Error(`Server error (${response.status}): ${responseText || response.statusText}`);
          }
        } catch (parseError) {
          // Handle case where response cannot be read at all
          console.error("API response status:", response.status, response.statusText);
          console.error("Response read error:", parseError);
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
      }

      let data;
      try {
        data = await response.json();
        console.log("Full API response:", data);
      } catch (jsonError) {
        console.error("Error parsing booking response JSON:", jsonError);
        throw new Error("Could not parse server response");
      }

      // Check for status === 'confirmed' instead of success flag
      if (data.status === 'confirmed' || data.success) {
        // Show success message
        toast({
          title: "Booking Created",
          description: "Your consultation has been booked. Proceeding to payment.",
        });
        
        // Ensure lawyer data is available
        if (!selectedLawyer || !selectedLawyer.name) {
          console.error("Missing lawyer information for payment", selectedLawyer);
          toast({
            title: "Error",
            description: "Missing lawyer information. Please try again.",
            variant: "destructive"
          });
          setBookingLoading(false);
          return;
        }
        
        // Use lawyer name from the data response as fallback if available
        const lawyerName = selectedLawyer.name || data.lawyerName || "Your Lawyer";
        
        // Show Stripe checkout in modal
        try {
          // Import the stripe utility dynamically to avoid issues with SSR
          const { createCheckoutSession } = await import('@/lib/stripe');
          console.log("Selected lawyer:", selectedLawyer);
          console.log("Booking datetime:", bookingDatetime);
          console.log("Booking method:", bookingMethod);
          
          // Check if we have a valid consultation ID from the booking response
          if (!data.consultationId) {
            console.error("Missing consultationId in booking response");
            throw new Error("Invalid booking data returned from server. ConsultationId is required for payment.");
          }
          
          // Ensure we have a valid fee to charge
          const fee = typeof data.fee?.total === 'string' 
            ? parseFloat(data.fee.total) 
            : (data.fee?.total || 5000);
            
          if (!fee || isNaN(fee) || fee <= 0) {
            console.error("Invalid fee in booking response:", data.fee);
            throw new Error("Invalid consultation fee. Please try again.");
          }
          
          // Create checkout session with Stripe
          const sessionData = await createCheckoutSession({
            consultationId: data.consultationId,
            lawyerName: lawyerName,
            datetime: bookingDatetime,
            method: bookingMethod || data.method,
            fee: fee,
            userId: user.id,
            useModal: false // Use page-based checkout
          });
          
          console.log("SessionData== ", sessionData);
          
          // Validate sessionData
          if (!sessionData || !sessionData.success) {
            console.error("Invalid session data returned:", sessionData);
            throw new Error("Could not create payment session. Please try again.");
          }
          
          // Redirect to Stripe checkout page
          if (sessionData.url) {
            console.log('Redirecting to Stripe checkout:', sessionData.url);
            window.location.href = sessionData.url;
          } else {
            throw new Error("Invalid payment session. Missing checkout URL.");
          }
        } catch (stripeError) {
          console.error('Error setting up payment:', stripeError);
          toast({
            title: "Payment Error",
            description: "Unable to process payment. Please try again.",
            variant: "destructive",
          });
          
          // Reset booking state on error
          setBookingLoading(false);
        }
      } else {
        // Log detailed response information for debugging
        console.error("API response failed with data:", data);
        
        // Try to extract more meaningful error information
        const errorMessage = data.message || data.error || 
                           (data.errors && Array.isArray(data.errors) && data.errors.length > 0 ? data.errors[0] : null) || 
                           "API returned failure status";
                           
        // Log payload for comparison
        console.error("Original request payload:", payload);
        
        toast({
          title: "Booking Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error booking consultation:", error);
      // Log more details about the error to help debugging
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      // Just stop the loading state but keep modal open
      setBookingLoading(false);
      // Don't close the booking modal on error
      // setShowBooking(false);
      
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setBookingLoading(false);
    }
  }
  

  


  // Handle proceeding to payment step
  const handleProceedToPayment = () => {
    console.log("Current selected lawyer state:", selectedLawyer);
    
    // Save payment journey before proceeding
    if (selectedLawyer) {
      const journeyData = {
        selectedLawyer,
        bookingDate,
        bookingTime,
        bookingMethod,
        bookingNotes,
        totalFee: consultationFees?.total_fee || 0,
        consultationFees
      }
      savePaymentJourney(journeyData)
    }
    
    // Set the booking step first regardless of validation
    setBookingStep('payment');
    
    // When proceeding to payment, we don't need to validate selectedLawyer here
    // because handleSubmitBooking will handle that validation
    // This prevents the "Missing lawyer information" error
    
    // Initialize payment process
    handleSubmitBooking();
  }

  // Handle continue later option
  const handleContinueLater = () => {
    // Save current booking state
    if (selectedLawyer) {
      const journeyData = {
        selectedLawyer,
        bookingDate,
        bookingTime,
        bookingMethod,
        bookingNotes,
        totalFee: consultationFees?.total_fee || 0,
        consultationFees
      }
      savePaymentJourney(journeyData)
    }
    
    // Close booking modal
    setShowBooking(false)
    setBookingStep('details')
    
    toast({
      title: "Booking Saved",
      description: "Your booking details have been saved. You can continue later from the dashboard.",
    })
  }

  // Submit feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConsultation || !selectedConsultation.id) {
      toast({
        title: 'Error',
        description: 'Invalid consultation information.',
        variant: 'destructive'
      })
      return
    }
    
    if (feedbackRating === 0) {
      toast({
        title: 'Missing Rating',
        description: 'Please provide a rating before submitting feedback.',
        variant: 'destructive'
      })
      return
    }
    
    setFeedbackLoading(true)
    console.log('Submitting feedback for consultation:', selectedConsultation.id)
    
    try {
      const res = await fetch(API_ENDPOINTS.CONSULTATIONS.FEEDBACK(selectedConsultation.id.toString()), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackRating,
          comments: feedbackComments
        })
      })
      
      console.log('Feedback response status:', res.status)
      
      if (!res.ok) {
        // Try to get more detailed error information
        const errorText = await res.text()
        console.error('Feedback error response:', errorText)
        throw new Error(`Feedback submission failed: ${res.status} ${res.statusText}`)
      }
      
      setShowFeedback(false)
      setFeedbackComments('')
      setFeedbackRating(0)
      
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
        variant: 'success'
      })
      
      console.log('Feedback submitted successfully')
      hasFetchedConsultations.current = false
      fetchConsultations()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      
      toast({
        title: 'Feedback Failed',
        description: error instanceof Error ? error.message : 'Could not submit feedback. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setFeedbackLoading(false)
    }
  }

  // Reschedule
  const handleRescheduleConsultation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConsultation || !rescheduleDate || !rescheduleTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and time for rescheduling.',
        variant: 'destructive'
      })
      return
    }
    
    setRescheduleLoading(true)
    try {
      const newDatetime = new Date(`${rescheduleDate}T${rescheduleTime}`)
      
      // Validate the date is valid
      if (isNaN(newDatetime.getTime())) {
        throw new Error('Invalid date or time format')
      }
      
      const res = await fetch(API_ENDPOINTS.CONSULTATIONS.CONSULTATION(selectedConsultation.id.toString()), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          newDatetime: newDatetime.toISOString()
        })
      })
      
      if (!res.ok) {
        // Try to get more detailed error information
        const errorText = await res.text()
        console.error('Reschedule error response:', errorText)
        throw new Error(`Reschedule failed: ${res.status} ${res.statusText}`)
      }
      
      setShowReschedule(false)
      setRescheduleDate('')
      setRescheduleTime('')
      toast({
        title: 'Consultation Rescheduled',
        description: 'Your consultation has been rescheduled.',
        variant: 'success'
      })
      hasFetchedConsultations.current = false
      fetchConsultations()
    } catch (error) {
      console.error('Error rescheduling consultation:', error)
      toast({
        title: 'Reschedule Failed',
        description: error instanceof Error ? error.message : 'Could not reschedule consultation. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setRescheduleLoading(false)
    }
  }

  // Cancel consultation
  const handleCancelConsultation = async (consultation: Consultation) => {
    if (!consultation || !consultation.id) {
      toast({
        title: 'Error',
        description: 'Invalid consultation information.',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const res = await fetch(API_ENDPOINTS.CONSULTATIONS.CONSULTATION(consultation.id.toString()), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      })
      
      if (!res.ok) {
        // Try to get more detailed error information
        const errorText = await res.text()
        console.error('Cancel error response:', errorText)
        throw new Error(`Cancel failed: ${res.status} ${res.statusText}`)
      }
      
      toast({
        title: 'Consultation Cancelled',
        description: 'Your consultation has been cancelled.',
        variant: 'success'
      })
      hasFetchedConsultations.current = false
      fetchConsultations()
    } catch (error) {
      console.error('Error cancelling consultation:', error)
      toast({
        title: 'Cancel Failed',
        description: error instanceof Error ? error.message : 'Could not cancel consultation. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleFindLawyer = () => {
    setShowFindLawyer(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'rescheduled': return <AlertCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'video': return <Video className="h-4 w-4" />
      case 'voice': return <Phone className="h-4 w-4" />
      case 'chat': return <MessageSquare className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  // Helper function to get lawyer expertise areas
  const getLawyerExpertise = (lawyer: Lawyer) => {
    return lawyer.expertise_areas || lawyer.specialty || []
  }

  // Helper function to get lawyer name
  const getLawyerName = (lawyer: Lawyer) => {
    return lawyer.name || lawyer.name || 'Legal Professional'
  }

  // Helper function to get verification status display
  const getVerificationDisplay = (lawyer: Lawyer) => {
    if (lawyer.is_verified) {
      return {
        text: 'Verified',
        icon: <CheckCircle className="mr-1 h-3 w-3" />,
        className: 'bg-green-100 text-green-800 border-green-200'
      }
    }
    
    if (lawyer.verification_status) {
      const statusConfig = {
        pending: {
          icon: <Clock className="mr-1 h-3 w-3" />,
          className: 'border-yellow-200 text-yellow-700 bg-yellow-50'
        },
        rejected: {
          icon: <XCircle className="mr-1 h-3 w-3" />,
          className: 'border-red-200 text-red-700 bg-red-50'
        },
        approved: {
          icon: <CheckCircle className="mr-1 h-3 w-3" />,
          className: 'border-green-200 text-green-700 bg-green-50'
        }
      }
      
      const config = statusConfig[lawyer.verification_status as keyof typeof statusConfig] || {
        icon: <AlertCircle className="mr-1 h-3 w-3" />,
        className: 'border-gray-200 text-gray-700 bg-gray-50'
      }
      
      return {
        text: lawyer.verification_status,
        icon: config.icon,
        className: config.className
      }
    }
    
    return {
      text: 'Not Verified',
      icon: <AlertCircle className="mr-1 h-3 w-3" />,
      className: 'border-gray-200 text-gray-700 bg-gray-50'
    }
  }

  // Helper function to get consultation room URL for a lawyer
  const getConsultationRoomUrl = async (lawyerId: string | number) => {
    const currentUser = userRef.current
    if (!currentUser) return null
    
    try {
      const response = await fetch(`${API_ENDPOINTS.CONSULTATIONS.MY_CONSULTATIONS}?userId=${currentUser.id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const consultations = await response.json()
      
      if (!Array.isArray(consultations)) {
        console.error('Expected array of consultations but got:', typeof consultations)
        return null
      }
      
      // Find the most recent active consultation with this lawyer
      const consultation = consultations.find((c: Consultation) => 
        c.lawyerName === lawyers.find(l => l.id === lawyerId)?.name && 
        c.status === 'confirmed' && 
        c.roomUrl
      )
      
      return consultation?.roomUrl || null
    } catch (error) {
      console.error('Error fetching consultation room URL:', error)
      return null
    }
  }

  // Helper function to check if user has active consultation with lawyer
  const hasActiveConsultation = async (lawyerId: string | number) => {
    const currentUser = userRef.current
    if (!currentUser) return false
    
    try {
      const response = await fetch(`${API_ENDPOINTS.CONSULTATIONS.MY_CONSULTATIONS}?userId=${currentUser.id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const consultations = await response.json()
      
      if (!Array.isArray(consultations)) {
        console.error('Expected array of consultations but got:', typeof consultations)
        return false
      }
      
      const lawyerName = lawyers.find(l => l.id === lawyerId)?.name
      return consultations.some((c: Consultation) => 
        c.lawyerName === lawyerName && 
        c.status === 'confirmed'
      )
    } catch (error) {
      console.error('Error checking active consultation:', error)
      return false
    }
  }

  const filteredLawyers = lawyers.filter((lawyer) =>
    (lawyer.name ?? '').toLowerCase().includes(lawyerSearch.toLowerCase()) ||
    (lawyer.specialty &&
      lawyer.specialty.some((s) =>
        s.toLowerCase().includes(lawyerSearch.toLowerCase())
      )) ||
    (lawyer.email &&
      lawyer.email.toLowerCase().includes(lawyerSearch.toLowerCase()))
  )

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout currentPage="/dashboard/consultations">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Consultations</h1>
              <p className="text-gray-600">Connect with qualified legal professionals for expert advice</p>
            </div>
            <Button onClick={handleFindLawyer} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Find a Lawyer
            </Button>
          </div>
        </div>

        {/* Saved Payment Journey Notification */}
        {savedPaymentJourney && (
          <div className="mb-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Saved Booking</h3>
                      <p className="text-sm text-blue-700">
                        You have a saved consultation booking with {savedPaymentJourney.selectedLawyer?.name} 
                        for {new Date(`${savedPaymentJourney.bookingDate}T${savedPaymentJourney.bookingTime}`).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => continuePaymentJourney(savedPaymentJourney)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Continue Booking
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearPaymentJourney}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="find" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Find a Lawyer
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              My Consultations
            </TabsTrigger>
          </TabsList>

          {/* Find a Lawyer Tab */}
          <TabsContent value="find" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Legal Professionals
                </CardTitle>
                <CardDescription>
                  Search and connect with verified legal experts in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, specialty, or email..."
                        value={lawyerSearch}
                        onChange={(e) => setLawyerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <SortAsc className="h-4 w-4 mr-2" />
                      Sort
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lawyers Grid */}
            {loadingLawyers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-6 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : lawyersError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Lawyers</h3>
                  <p className="text-gray-600 text-center">{lawyersError}</p>
                  <Button onClick={() => window.location.reload()} className="mt-4">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : filteredLawyers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lawyers Found</h3>
                  <p className="text-gray-600 text-center">
                    {lawyerSearch ? 'Try adjusting your search criteria' : 'No lawyers are currently available'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLawyers.map((lawyer) => (
                  <Card key={lawyer.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarImage src={lawyer.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {getLawyerName(lawyer).split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate text-lg">
                              {getLawyerName(lawyer)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {lawyer.experience ? `${lawyer.experience} years experience` : 'Experienced professional'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {/* Verification Status */}
                          <div className="flex items-center gap-1">
                            {(() => {
                              const verification = getVerificationDisplay(lawyer)
                              return (
                                <Badge variant="outline" className={`text-xs ${verification.className}`}>
                                  {verification.icon}
                                  {verification.text}
                                </Badge>
                              )
                            })()}
                          </div>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-medium">
                              {lawyer.performance_score || 'N/A'}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Expertise Areas */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <Award className="h-4 w-4 text-blue-600" />
                          Expertise Areas
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {getLawyerExpertise(lawyer).slice(0, 3).map((area, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {area}
                            </Badge>
                          ))}
                          {getLawyerExpertise(lawyer).length > 3 && (
                            <Badge variant="outline" className="text-xs text-gray-600">
                              +{getLawyerExpertise(lawyer).length - 3} more
                            </Badge>
                          )}
                          {getLawyerExpertise(lawyer).length === 0 && (
                            <span className="text-xs text-gray-500 italic">No expertise areas listed</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Availability Status */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          {lawyer.is_available ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                              <span className="text-xs font-medium">Available Now</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-500">
                              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                              <span className="text-xs font-medium">Currently Offline</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProfileLawyer(lawyer)
                              setShowLawyerProfile(true)
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            disabled={!lawyer.is_available}
                            onClick={() => {
                              setSelectedLawyer(lawyer)
                              setShowBooking(true)
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            Book
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Consultations Tab */}
          <TabsContent value="my" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      My Consultations
                    </CardTitle>
                    <CardDescription>
                      Manage your scheduled and completed legal consultations
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      hasFetchedConsultations.current = false
                      fetchConsultations()
                    }}
                    disabled={loadingConsultations}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingConsultations ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingConsultations ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : consultationsError ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Consultations</h3>
                    <p className="text-gray-600 text-center mb-4">{consultationsError}</p>
                    <Button onClick={fetchConsultations}>Try Again</Button>
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Consultations Yet</h3>
                    <p className="text-gray-600 text-center mb-4">
                      Book your first consultation with a legal professional
                    </p>
                    <Button onClick={handleFindLawyer}>
                      <Plus className="h-4 w-4 mr-2" />
                      Find a Lawyer
                    </Button>
                    
                    {/* Debug information */}
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs max-w-md">
                      <p className="font-semibold mb-2">Debug Info:</p>
                      <p>User ID: {user?.id || 'Not loaded'}</p>
                      <p>Consultations loaded: {consultations.length}</p>
                      <p>Loading state: {loadingConsultations ? 'true' : 'false'}</p>
                      <p>Error state: {consultationsError || 'none'}</p>
                      <p>Has fetched: {hasFetchedConsultations.current ? 'true' : 'false'}</p>
                      <p>User ref: {userRef.current?.id || 'Not set'}</p>
                      {consultations.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold">Raw Data:</p>
                          <pre className="text-xs overflow-auto max-h-32">
                            {JSON.stringify(consultations, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Debug info for consultations */}
                    {/* <div className="p-4 bg-blue-50 rounded-lg text-xs">
                      <p className="font-semibold mb-2">Consultations Debug:</p>
                      <p>Total consultations: {consultations.length}</p>
                      <p>First consultation: {consultations[0] ? JSON.stringify(consultations[0]) : 'None'}</p>
                    </div> */}
                    
                    {consultations.map((consultation) => {
                      const isConfirmed = consultation.status === 'confirmed'
                      const isCompleted = consultation.status === 'completed'
                      const isCancelled = consultation.status === 'cancelled'
                      
                      // Safe date parsing with fallback
                      let datetime: Date
                      try {
                        datetime = new Date(consultation.datetime)
                        if (isNaN(datetime.getTime())) {
                          datetime = new Date()
                        }
                      } catch {
                        datetime = new Date()
                      }
                      
                      return (
                        <Card key={consultation.id} className="overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {consultation.lawyerName?.split(' ').map((n) => n[0]).join('') || 'LA'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">{consultation.lawyerName}</h3>
                                    <Badge className={`${getStatusColor(consultation.status)} border`}>
                                      {getStatusIcon(consultation.status)}
                                      <span className="ml-1 capitalize">{consultation.status}</span>
                                    </Badge>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {datetime.toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {getMethodIcon(consultation.method)}
                                      <span className="capitalize">{consultation.method}</span>
                                    </div>
                                  </div>
                                  {consultation.notes && (
                                    <p className="text-sm text-gray-600 mt-2">{consultation.notes}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2">
                                {isConfirmed && (
                                  <>
                                    {consultation.roomUrl && (
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={consultation.roomUrl} target="_blank" rel="noopener noreferrer">
                                          <Video className="h-4 w-4 mr-1" />
                                          Join Meeting
                                        </a>
                                      </Button>
                                    )}
                                    <AddToCalendarButton
                                      name={`Legal Consultation with ${consultation.lawyerName}`}
                                      description={`Legal consultation via ${consultation.method}. ${consultation.notes ? `Notes: ${consultation.notes}` : ''}`}
                                      startDate={new Date(consultation.datetime).toISOString().split('T')[0]}
                                      startTime={new Date(consultation.datetime).toTimeString().slice(0, 5)}
                                      location={consultation.method === 'video' ? 'Video call link will be provided before the meeting' : consultation.method === 'voice' ? 'Phone call' : 'Chat consultation'}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedConsultation(consultation)
                                        setShowReschedule(true)
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Reschedule
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancelConsultation(consultation)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </>
                                )}
                                
                                {isCompleted && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedConsultation(consultation)
                                      setShowFeedback(true)
                                    }}
                                  >
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                    Leave Feedback
                                  </Button>
                                )}
                                
                                {isCancelled && (
                                  <Badge variant="outline" className="text-gray-500">
                                    Cancelled
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Booking Modal */}
        <Dialog open={showBooking} onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCancelBooking()
          } else {
            setShowBooking(isOpen)
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {bookingStep === 'details' && 'Book Consultation'}
                {bookingStep === 'review' && 'Review Consultation Details'}
                {bookingStep === 'payment' && 'Complete Payment'}
                {bookingStep === 'confirmation' && 'Booking Confirmed'}
              </DialogTitle>
              <DialogDescription>
                {bookingStep === 'details' && `Schedule a consultation with ${selectedLawyer?.name}`}
                {bookingStep === 'review' && 'Please review your consultation details before proceeding'}
                {bookingStep === 'payment' && 'Complete payment to confirm your booking'}
                {bookingStep === 'confirmation' && 'Your consultation has been successfully booked'}
              </DialogDescription>
            </DialogHeader>
            
            {/* Step 1: Details Form */}
            {bookingStep === 'details' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleNextStep();
              }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Method</label>
                  <Select value={bookingMethod} onValueChange={setBookingMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Video Call
                        </div>
                      </SelectItem>
                      <SelectItem value="chat">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Chat
                        </div>
                      </SelectItem>
                      <SelectItem value="voice">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Voice Call
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea
                    placeholder="Describe your legal issue or questions..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCancelBooking()}
                    disabled={bookingLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={bookingLoading}>
                    {bookingLoading ? 'Processing...' : 'Next'}
                  </Button>
                </div>
              </form>
            )}
            
            {/* Step 2: Review Details */}
            {bookingStep === 'review' && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Consultation with:</span>
                    <span className="text-sm">{selectedLawyer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Date & Time:</span>
                    <span className="text-sm">
                      {new Date(`${bookingDate}T${bookingTime}`).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Method:</span>
                    <span className="text-sm flex items-center gap-1">
                      {getMethodIcon(bookingMethod)}
                      {bookingMethod === 'video' && 'Video Call'}
                      {bookingMethod === 'chat' && 'Chat'}
                      {bookingMethod === 'voice' && 'Voice Call'}
                    </span>
                  </div>
                  {bookingNotes && (
                    <div className="pt-2">
                      <span className="text-sm font-medium">Notes:</span>
                      <p className="text-sm mt-1">{bookingNotes}</p>
                    </div>
                  )}
                </div>
                
                {/* Fee Details */}
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Fee Details</h4>
                  <div className="flex justify-between">
                    <span className="text-sm">Base Consultation Fee</span>
                    <span className="text-sm">${consultationFees?.base_fee.toFixed(2)}</span>
                  </div>
                  
                  {bookingMethod === 'voice' && consultationFees?.additional_fee ? (
                    <div className="flex justify-between">
                      <span className="text-sm">Voice Call Additional Fee</span>
                      <span className="text-sm">${consultationFees.additional_fee.toFixed(2)}</span>
                    </div>
                  ) : null}
                  
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total</span>
                    <span>${consultationFees?.total_fee.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Special Instructions for Voice Call */}
                {bookingMethod === 'voice' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Info className="h-4 w-4" /> Voice Call Instructions
                    </h4>
                    <p className="text-sm mt-2">
                      The lawyer will call you at the scheduled time. Please ensure your contact 
                      details are up to date and you&apos;re available to take the call.
                    </p>
                  </div>
                )}
                
                <DialogFooter className="flex justify-between border-t pt-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleContinueLater}
                      disabled={bookingLoading}
                    >
                      Continue Later
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      disabled={bookingLoading}
                    >
                      Back
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
            
            {/* Step 3: Payment - Loading State */}
            {bookingStep === 'payment' && (
              <div className="space-y-4 flex flex-col items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
                  <h3 className="font-medium text-lg mb-2">Processing Payment</h3>
                  <p className="text-gray-500">Please wait while we prepare your payment...</p>
                </div>
              </div>
            )}
            
            {/* Step 4: Confirmation */}
            {bookingStep === 'confirmation' && (
              <div className="space-y-4 text-center">
                <div className="py-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                
                <h3 className="font-medium text-lg">Consultation Booked Successfully!</h3>
                
                <div className="border rounded-lg p-4 text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Consultation with:</span>
                    <span className="text-sm">{selectedLawyer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Date & Time:</span>
                    <span className="text-sm">
                      {new Date(`${bookingDate}T${bookingTime}`).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Method:</span>
                    <span className="text-sm flex items-center gap-1">
                      {getMethodIcon(bookingMethod)}
                      {bookingMethod === 'video' && 'Video Call'}
                      {bookingMethod === 'chat' && 'Chat'}
                      {bookingMethod === 'voice' && 'Voice Call'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Fee:</span>
                    <span className="text-sm">${consultationFees?.total_fee.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <AddToCalendarButton
                      name={`Legal Consultation with ${selectedLawyer?.name}`}
                      description={`Legal consultation via ${bookingMethod}. ${bookingNotes ? `Notes: ${bookingNotes}` : ''}`}
                      startDate={bookingDate}
                      startTime={bookingTime}
                      location={bookingMethod === 'video' ? 'Video call link will be provided before the meeting' : bookingMethod === 'voice' ? 'Phone call' : 'Chat consultation'}
                    />
                  </div>
                </div>
                
                {bookingMethod === 'voice' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <h4 className="font-medium flex items-center gap-2 text-blue-800">
                      <Info className="h-4 w-4" /> Next Steps
                    </h4>
                    <p className="text-sm mt-2">
                      The lawyer will call you at the scheduled time. Make sure your phone details 
                      are up to date. You&apos;ll receive an email with the confirmation details.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-center pt-4">
                  <Button type="button" onClick={() => handleCancelBooking()}>
                    Done
                  </Button>
                </div>
              </div>
            )}

          </DialogContent>
        </Dialog>

        {/* Feedback Modal */}
        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Leave Feedback</DialogTitle>
              <DialogDescription>
                Help us improve by sharing your experience
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`p-2 rounded-lg transition-colors ${
                        star <= feedbackRating
                          ? 'text-yellow-500 bg-yellow-50'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Comments</label>
                <Textarea
                  placeholder="Share your experience..."
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFeedback(false)}
                  disabled={feedbackLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={feedbackLoading}>
                  {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reschedule Modal */}
        <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Reschedule Consultation</DialogTitle>
              <DialogDescription>
                Choose a new date and time for your consultation
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRescheduleConsultation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Date</label>
                  <Input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Time</label>
                  <Input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReschedule(false)
                    setRescheduleDate('')
                    setRescheduleTime('')
                  }}
                  disabled={rescheduleLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={rescheduleLoading}>
                  {rescheduleLoading ? 'Rescheduling...' : 'Reschedule'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Lawyer Profile Modal */}
        <Dialog open={showLawyerProfile} onOpenChange={setShowLawyerProfile}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col max-h-[85vh]">
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={profileLawyer?.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                      {profileLawyer?.name?.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{profileLawyer ? getLawyerName(profileLawyer) : 'Legal Professional'}</h3>
                <p className="text-gray-600 mt-1">
                  {profileLawyer ? getLawyerExpertise(profileLawyer).join(', ') : 'Specialized in legal matters'}
                </p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-yellow-700">{profileLawyer?.performance_score || 'N/A'}/5</span>
                  </div>
                  <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-700">{profileLawyer?.experience || 'Experienced'} years</span>
                  </div>
                  {profileLawyer?.is_verified && (
                    <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-blue-700">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-2 pt-4">
                <div className="w-full space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Availability ({profileLawyer?.availability?.length || 0} slots)
                    </h4>
                    <div className="rounded-lg bg-gray-50 p-4 max-h-48 overflow-y-auto">
                      {Array.isArray(profileLawyer?.availability) && profileLawyer.availability.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {profileLawyer.availability.map((slot, i) => (
                            <li key={i} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center">
                                <Clock4 className="mr-2 h-4 w-4 text-gray-400" />
                                <span className="font-medium">
                                  {new Date(slot).toLocaleDateString([], {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600">
                                {new Date(slot).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-6">
                          <CalendarDays className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No availability slots
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Check back later for updated availability
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Active Consultations Section */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Active Consultations ({(() => {
                        const activeConsultations = consultations.filter(c => 
                          c.lawyerName === (profileLawyer ? getLawyerName(profileLawyer) : '') && 
                          c.status === 'confirmed'
                        )
                        return activeConsultations.length
                      })()})
                    </h4>
                    <div className="rounded-lg bg-blue-50 p-4 max-h-60 overflow-y-auto">
                      {(() => {
                        const activeConsultations = consultations.filter(c => 
                          c.lawyerName === (profileLawyer ? getLawyerName(profileLawyer) : '') && 
                          c.status === 'confirmed'
                        )
                        
                        if (activeConsultations.length > 0) {
                          return (
                            <div className="space-y-2">
                              {activeConsultations.map((consultation, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      {getMethodIcon(consultation.method)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {new Date(consultation.datetime).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {new Date(consultation.datetime).toLocaleTimeString()}
                                      </p>
                                      <p className="text-xs text-blue-600 font-medium">
                                        {consultation.method === 'video' ? 'Video Call' : consultation.method === 'chat' ? 'Live Chat' : 'Phone Call'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {consultation.roomUrl && consultation.method === 'video' && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => window.open(consultation.roomUrl, '_blank')}
                                        className="text-blue-600 hover:text-blue-700"
                                      >
                                        <VideoIcon className="h-3 w-3 mr-1" />
                                        Join
                                      </Button>
                                    )}
                                    {consultation.method === 'chat' && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => window.open(`/dashboard/ai-assistant?consultation=${consultation.id}`, '_blank')}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        Chat
                                      </Button>
                                    )}
                                    {consultation.method === 'phone' && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => window.open(`tel:${profileLawyer?.phone}`, '_blank')}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <Phone className="h-3 w-3 mr-1" />
                                        Call
                                      </Button>
                                    )}
                                    <AddToCalendarButton
                                      name={`Legal Consultation with ${profileLawyer?.name}`}
                                      description={`Legal consultation via ${consultation.method}.`}
                                      startDate={new Date(consultation.datetime).toISOString().split('T')[0]}
                                      startTime={new Date(consultation.datetime).toTimeString().slice(0, 5)}
                                      location={consultation.method === 'video' ? 'Video call link will be provided before the meeting' : consultation.method === 'voice' ? 'Phone call' : 'Chat consultation'}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        } else {
                          return (
                            <div className="text-center py-8">
                              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                No active consultations with this lawyer
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Book a consultation to see it here
                              </p>
                            </div>
                          )
                        }
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Verification
                  </h4>
                  <div className="space-y-2">
                    {profileLawyer?.is_verified ? (
                      <Badge variant="default" className="w-fit">
                        <Award className="mr-1 h-3 w-3" />
                        Verified Professional
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-fit">
                        {profileLawyer?.verification_status || 'Pending Verification'}
                      </Badge>
                    )}
                    <p className="text-xs text-gray-500">
                      All verified professionals have completed background checks and credential verification
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Expertise Areas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profileLawyer ? getLawyerExpertise(profileLawyer).map((area, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {area}
                      </Badge>
                    )) : (
                      <span className="text-sm text-gray-500 italic">No expertise areas listed</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4" />
                    Communication Options
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Video Call Option */}
                    <div className="group cursor-pointer p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-600 rounded-lg">
                            <VideoIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-blue-900">Video Call</h5>
                            <p className="text-xs text-blue-700">Face-to-face consultation</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={async () => {
                            if (!profileLawyer?.id) {
                              toast({
                                title: 'Error',
                                description: 'Lawyer information not available.',
                                variant: 'destructive'
                              })
                              return
                            }
                            
                            const hasActive = await hasActiveConsultation(profileLawyer.id)
                            if (!hasActive) {
                              toast({
                                title: 'No Active Consultation',
                                description: 'Please book a consultation first to access video call.',
                                variant: 'destructive'
                              })
                              return
                            }
                            
                            const roomUrl = await getConsultationRoomUrl(profileLawyer.id)
                            if (roomUrl) {
                              try {
                                window.open(roomUrl, '_blank')
                                toast({
                                  title: 'Video Call Started',
                                  description: 'Opening video call in new tab...',
                                  variant: 'success'
                                })
                              } catch {
                                toast({
                                  title: 'Error',
                                  description: 'Could not open video call. Please try again.',
                                  variant: 'destructive'
                                })
                              }
                            } else {
                              toast({
                                title: 'No Room URL',
                                description: 'Could not find a video call room URL for this consultation.',
                                variant: 'destructive'
                              })
                            }
                          }}
                        >
                          Join Call
                        </Button>
                      </div>
                    </div>

                    {/* Chat Option */}
                    <div className="group cursor-pointer p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-600 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-green-900">Live Chat</h5>
                            <p className="text-xs text-green-700">Real-time messaging</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={async () => {
                            if (!profileLawyer?.id) {
                              toast({
                                title: 'Error',
                                description: 'Lawyer information not available.',
                                variant: 'destructive'
                              })
                              return
                            }
                            
                            const hasActive = await hasActiveConsultation(profileLawyer.id)
                            if (!hasActive) {
                              toast({
                                title: 'No Active Consultation',
                                description: 'Please book a consultation first to access chat.',
                                variant: 'destructive'
                              })
                              return
                            }
                            
                            // Generate or get chat link
                            const chatLink = `/dashboard/ai-assistant?lawyer=${profileLawyer.id}&consultation=true`
                            try {
                              window.open(chatLink, '_blank')
                              toast({
                                title: 'Chat Started',
                                description: 'Opening chat interface in new tab...',
                                variant: 'success'
                              })
                            } catch {
                              toast({
                                title: 'Error',
                                description: 'Could not open chat. Please try again.',
                                variant: 'destructive'
                              })
                            }
                          }}
                        >
                          Start Chat
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Direct Communication Links */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Direct Contact</h5>
                    <div className="flex flex-wrap gap-2">
                      {profileLawyer?.email && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`mailto:${profileLawyer.email}`, '_blank')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      )}
                      {profileLawyer?.phone && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`tel:${profileLawyer.phone}`, '_blank')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const whatsappLink = `https://wa.me/${profileLawyer?.phone?.replace(/\D/g, '')}?text=Hi ${profileLawyer?.name}, I'd like to discuss a legal matter.`
                          window.open(whatsappLink, '_blank')
                        }}
                        className="text-green-600 hover:text-green-700"
                        disabled={!profileLawyer?.phone}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full pt-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedLawyer(profileLawyer)
                    setShowBooking(true)
                    setShowLawyerProfile(false)
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Book Consultation
                </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Find Lawyer Dialog */}
        <Dialog open={showFindLawyer} onOpenChange={setShowFindLawyer}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Available Lawyers</DialogTitle>
              <DialogDescription>
                Browse our network of qualified legal professionals
              </DialogDescription>
            </DialogHeader>
            {loadingLawyers ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
                <p className="mt-4 text-gray-600">Loading lawyers...</p>
              </div>
            ) : lawyersError ? (
              <div className="rounded-lg bg-red-50 p-4 text-red-600">
                {lawyersError}
              </div>
            ) : lawyers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <Users className="h-10 w-10 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No lawyers found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLawyers.map((lawyer) => (
                  <Card key={lawyer.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarImage src={lawyer.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {lawyer.name?.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{lawyer.name}</h3>
                              {lawyer.is_verified && (
                                <Badge variant="default" className="text-xs">
                                  <Award className="mr-1 h-3 w-3" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {lawyer.experience} years experience • {lawyer.specialty?.slice(0, 2).join(', ')}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span>{lawyer.performance_score}/5</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {lawyer.is_available ? (
                                  <>
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span>Available</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                    <span>Offline</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          disabled={!lawyer.is_available}
                          onClick={() => {
                            setSelectedLawyer(lawyer)
                            setShowBooking(true)
                            setShowFindLawyer(false)
                          }}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Book
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      

      
      {/* Cancel Booking Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              No, Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleCancelBookingConfirmed}>
              Yes, Cancel Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}