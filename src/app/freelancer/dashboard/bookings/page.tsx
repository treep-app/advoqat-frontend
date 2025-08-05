'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  User,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  Phone as PhoneIcon
} from 'lucide-react'
import FreelancerLayout from '@/components/layout/freelancer-layout'
import { API_ENDPOINTS } from '@/lib/config'

interface Consultation {
  id: number
  client_name: string
  client_email: string
  client_phone: string
  consultation_date: string
  consultation_time: string
  duration: number
  consultation_type: 'video' | 'phone' | 'in-person'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  fee: number
  notes?: string
  created_at: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  freelancer_id: number
}

export default function BookingsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(storedUserId)
      fetchConsultations(storedUserId)
    }
  }, [])

  const fetchConsultations = async (id: string) => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(API_ENDPOINTS.FREELANCERS.CONSULTATIONS(id))
      if (response.ok) {
        const data = await response.json()
        setConsultations(data)
      } else {
        setError('Failed to fetch consultations')
      }
    } catch (error) {
      console.error('Error fetching consultations:', error)
      setError('Failed to fetch consultations')
    } finally {
      setLoading(false)
    }
  }

  const handleConsultationAction = async (consultationId: number, action: 'confirm' | 'complete' | 'cancel') => {
    try {
      setActionLoading(consultationId)
      setError('')

      let endpoint: string
      switch (action) {
        case 'confirm':
          endpoint = API_ENDPOINTS.FREELANCERS.CONFIRM_CONSULTATION(consultationId.toString())
          break
        case 'complete':
          endpoint = API_ENDPOINTS.FREELANCERS.COMPLETE_CONSULTATION(consultationId.toString())
          break
        case 'cancel':
          endpoint = API_ENDPOINTS.FREELANCERS.CANCEL_CONSULTATION(consultationId.toString())
          break
        default:
          throw new Error('Invalid action')
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        // Refresh consultations after action
        if (userId) {
          fetchConsultations(userId)
        }
      } else {
        setError(`Failed to ${action} consultation`)
      }
    } catch (error) {
      console.error(`Error ${action}ing consultation:`, error)
      setError(`Failed to ${action} consultation`)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case 'confirmed':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Confirmed</Badge>
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'phone':
        return <PhoneIcon className="h-4 w-4" />
      case 'in-person':
        return <MapPin className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getFilteredConsultations = (status: string) => {
    if (status === 'all') return consultations
    return consultations.filter(c => c.status === status)
  }

  if (loading) {
    return (
      <FreelancerLayout>
        <div className="p-4 md:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-4">Loading Bookings...</h1>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </FreelancerLayout>
    )
  }

  return (
    <FreelancerLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consultation Bookings</h1>
            <p className="text-gray-600">Manage your client consultation appointments</p>
          </div>
          <Button onClick={() => userId && fetchConsultations(userId)}>
            <Calendar className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Consultations</p>
                  <p className="text-2xl font-bold">{consultations.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{consultations.filter(c => c.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold">{consultations.filter(c => c.status === 'confirmed').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{consultations.filter(c => c.status === 'completed').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Bookings</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {getFilteredConsultations(status).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No consultations found</h3>
                    <p className="text-gray-600">
                      {status === 'all' 
                        ? "You don't have any consultation bookings yet."
                        : `No ${status} consultations found.`
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {getFilteredConsultations(status).map((consultation) => (
                    <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">Consultation with {consultation.client_name}</h3>
                              {getStatusBadge(consultation.status)}
                            </div>
                            
                                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                               <div className="flex items-center gap-2">
                                 <Calendar className="h-4 w-4 text-gray-500" />
                                 <span className="font-medium">Date:</span>
                                 <span>{formatDate(consultation.consultation_date)}</span>
                               </div>
                               
                               <div className="flex items-center gap-2">
                                 <Clock className="h-4 w-4 text-gray-500" />
                                 <span className="font-medium">Time:</span>
                                 <span>{formatTime(consultation.consultation_time)} ({consultation.duration} min)</span>
                               </div>
                               
                               <div className="flex items-center gap-2">
                                 <DollarSign className="h-4 w-4 text-gray-500" />
                                 <span className="font-medium">Fee:</span>
                                 <span>{formatCurrency(consultation.fee)}</span>
                               </div>
                               
                               <div className="flex items-center gap-2">
                                 {getConsultationTypeIcon(consultation.consultation_type)}
                                 <span className="font-medium">Type:</span>
                                 <span className="capitalize">{consultation.consultation_type}</span>
                               </div>
                             </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                                                     {/* Client Information */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                             <div className="flex items-center gap-2">
                               <User className="h-4 w-4 text-gray-500" />
                               <span className="font-medium">Client:</span>
                               <span>{consultation.client_name}</span>
                             </div>
                             
                             <div className="flex items-center gap-2">
                               <Mail className="h-4 w-4 text-gray-500" />
                               <span className="font-medium">Email:</span>
                               <span>{consultation.client_email}</span>
                             </div>
                             
                             <div className="flex items-center gap-2">
                               <Phone className="h-4 w-4 text-gray-500" />
                               <span className="font-medium">Phone:</span>
                               <span>{consultation.client_phone}</span>
                             </div>
                           </div>
                           
                           {/* Notes */}
                           {consultation.notes && (
                             <div className="p-3 bg-blue-50 rounded-lg">
                               <p className="text-sm font-medium text-blue-900 mb-1">Client Notes:</p>
                               <p className="text-sm text-blue-800">{consultation.notes}</p>
                             </div>
                           )}
                           
                           {/* Cancellation Reason */}
                           {consultation.cancellation_reason && (
                             <div className="p-3 bg-red-50 rounded-lg">
                               <p className="text-sm font-medium text-red-900 mb-1">Cancellation Reason:</p>
                               <p className="text-sm text-red-800">{consultation.cancellation_reason}</p>
                             </div>
                           )}
                          
                                                     {/* Actions */}
                           <div className="flex items-center justify-between">
                             <div className="text-sm text-gray-500">
                               Booked: {formatDate(consultation.created_at)}
                             </div>
                             
                             <div className="flex items-center gap-2">
                               {consultation.status === 'pending' && (
                                 <>
                                   <Button
                                     size="sm"
                                     onClick={() => handleConsultationAction(consultation.id, 'confirm')}
                                     disabled={actionLoading === consultation.id}
                                   >
                                     <CheckCircle className="h-4 w-4 mr-1" />
                                     {actionLoading === consultation.id ? 'Confirming...' : 'Confirm'}
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => handleConsultationAction(consultation.id, 'cancel')}
                                     disabled={actionLoading === consultation.id}
                                   >
                                     <XCircle className="h-4 w-4 mr-1" />
                                     {actionLoading === consultation.id ? 'Cancelling...' : 'Cancel'}
                                   </Button>
                                 </>
                               )}
                               
                               {consultation.status === 'confirmed' && (
                                 <Button
                                   size="sm"
                                   onClick={() => handleConsultationAction(consultation.id, 'complete')}
                                   disabled={actionLoading === consultation.id}
                                 >
                                   <CheckCircle className="h-4 w-4 mr-1" />
                                   {actionLoading === consultation.id ? 'Completing...' : 'Mark Complete'}
                                 </Button>
                               )}
                               
                               <Button size="sm" variant="ghost">
                                 <MessageCircle className="h-4 w-4 mr-1" />
                                 Contact Client
                               </Button>
                             </div>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </FreelancerLayout>
  )
} 