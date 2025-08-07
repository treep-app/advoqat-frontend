'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Video, MessageSquare, Phone, Plus, Users, CalendarDays, CheckCircle, X, AlertCircle } from 'lucide-react'
import FreelancerLayout from '@/components/layout/freelancer-layout'
import { API_ENDPOINTS } from '@/lib/config'
import { useToast } from '@/components/ui/use-toast'

interface Consultation {
  id: number
  case_id: number
  case_title: string
  case_description: string
  client_name: string
  client_email: string
  freelancer_name: string
  consultation_type: 'chat' | 'video' | 'audio'
  scheduled_at: string
  duration: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  meeting_link?: string
  created_at: string
}

interface Case {
  id: number
  title: string
  description: string
  client_name: string
  status: string
}

export default function ConsultationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  })

  const [newConsultation, setNewConsultation] = useState({
    caseId: '',
    consultationType: 'chat',
    scheduledAt: '',
    duration: 30,
    notes: ''
  })

  useEffect(() => {
    fetchConsultations()
    fetchCases()
  }, [])

  const fetchConsultations = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        throw new Error('User ID not found')
      }

      const response = await fetch(API_ENDPOINTS.CONSULTATIONS.GET_USER_CONSULTATIONS('freelancer', userId))
      if (!response.ok) {
        throw new Error('Failed to fetch consultations')
      }

      const data = await response.json()
      setConsultations(data.consultations || [])

      // Fetch stats
      const statsResponse = await fetch(API_ENDPOINTS.CONSULTATIONS.STATS('freelancer', userId))
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error fetching consultations:', error)
      toast({
        title: "Error",
        description: "Failed to load consultations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCases = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) return

      const response = await fetch(API_ENDPOINTS.CASES.FREELANCER_CASES(userId))
      if (response.ok) {
        const data = await response.json()
        setCases(data.filter((caseItem: Case) => caseItem.status === 'active'))
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
    }
  }

  const handleScheduleConsultation = async () => {
    if (!newConsultation.caseId || !newConsultation.scheduledAt) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setScheduling(true)
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        throw new Error('User ID not found')
      }

      const selectedCase = cases.find(c => c.id === parseInt(newConsultation.caseId))
      if (!selectedCase) {
        throw new Error('Selected case not found')
      }

      const requestBody = {
        caseId: parseInt(newConsultation.caseId),
        freelancerId: userId,
        clientId: selectedCase.client_id,
        consultationType: newConsultation.consultationType,
        scheduledAt: newConsultation.scheduledAt,
        duration: newConsultation.duration,
        notes: newConsultation.notes
      }

      console.log('Scheduling consultation with data:', requestBody)
      console.log('Selected case:', selectedCase)

      const response = await fetch(API_ENDPOINTS.CONSULTATIONS.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to schedule consultation')
      }

      const result = await response.json()
      
      toast({
        title: "Consultation Scheduled",
        description: "Consultation has been scheduled successfully",
        variant: "default",
      })

      setNewConsultation({
        caseId: '',
        consultationType: 'chat',
        scheduledAt: '',
        duration: 30,
        notes: ''
      })
      setShowScheduleDialog(false)
      fetchConsultations()
    } catch (error) {
      console.error('Error scheduling consultation:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule consultation",
        variant: "destructive",
      })
    } finally {
      setScheduling(false)
    }
  }

  const handleStartConsultation = async (consultationId: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.CONSULTATIONS.START(consultationId.toString()), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to start consultation')
      }

      const result = await response.json()
      
      toast({
        title: "Consultation Started",
        description: "Consultation has been started successfully",
        variant: "default",
      })

      fetchConsultations()
    } catch (error) {
      console.error('Error starting consultation:', error)
      toast({
        title: "Error",
        description: "Failed to start consultation",
        variant: "destructive",
      })
    }
  }

  const handleEndConsultation = async (consultationId: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.CONSULTATIONS.END(consultationId.toString()), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to end consultation')
      }

      const result = await response.json()
      
      toast({
        title: "Consultation Ended",
        description: "Consultation has been ended successfully",
        variant: "default",
      })

      fetchConsultations()
    } catch (error) {
      console.error('Error ending consultation:', error)
      toast({
        title: "Error",
        description: "Failed to end consultation",
        variant: "destructive",
      })
    }
  }

  const handleCancelConsultation = async (consultationId: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.CONSULTATIONS.CANCEL(consultationId.toString()), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by lawyer' })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel consultation')
      }

      const result = await response.json()
      
      toast({
        title: "Consultation Cancelled",
        description: "Consultation has been cancelled successfully",
        variant: "default",
      })

      fetchConsultations()
    } catch (error) {
      console.error('Error cancelling consultation:', error)
      toast({
        title: "Error",
        description: "Failed to cancel consultation",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'no_show':
        return <Badge variant="outline" className="bg-red-100 text-red-800">No Show</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'audio':
        return <Phone className="h-4 w-4" />
      case 'chat':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <FreelancerLayout>
        <div className="p-4 md:p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading consultations...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
            <p className="text-gray-600 mt-1">Schedule and manage client consultations</p>
          </div>
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Consultation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Schedule New Consultation</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="case">Case</Label>
                  <Select value={newConsultation.caseId} onValueChange={(value) => setNewConsultation({...newConsultation, caseId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a case" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((caseItem) => (
                        <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                          {caseItem.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Consultation Type</Label>
                  <Select value={newConsultation.consultationType} onValueChange={(value) => setNewConsultation({...newConsultation, consultationType: value as 'chat' | 'video' | 'audio'})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="audio">Audio Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="datetime">Date & Time</Label>
                  <Input
                    id="datetime"
                    type="datetime-local"
                    value={newConsultation.scheduledAt}
                    onChange={(e) => setNewConsultation({...newConsultation, scheduledAt: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newConsultation.duration}
                    onChange={(e) => setNewConsultation({...newConsultation, duration: parseInt(e.target.value)})}
                    min="15"
                    max="120"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newConsultation.notes}
                    onChange={(e) => setNewConsultation({...newConsultation, notes: e.target.value})}
                    placeholder="Optional notes for the consultation..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleScheduleConsultation} disabled={scheduling}>
                  {scheduling ? 'Scheduling...' : 'Schedule Consultation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.scheduled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Consultations List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Consultations</h3>
                <p className="text-gray-600 mb-4">You haven't scheduled any consultations yet.</p>
                <Button onClick={() => setShowScheduleDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Your First Consultation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <div key={consultation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{consultation.case_title}</h3>
                          {getStatusBadge(consultation.status)}
                          <div className="flex items-center gap-1 text-gray-500">
                            {getTypeIcon(consultation.consultation_type)}
                            <span className="text-sm capitalize">{consultation.consultation_type}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{consultation.case_description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{consultation.client_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDateTime(consultation.scheduled_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{consultation.duration} minutes</span>
                          </div>
                          {consultation.meeting_link && (
                            <div className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              <a href={consultation.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                        {consultation.notes && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            <strong>Notes:</strong> {consultation.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {consultation.status === 'scheduled' && (
                          <>
                            <Button size="sm" onClick={() => handleStartConsultation(consultation.id)}>
                              Start
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCancelConsultation(consultation.id)}>
                              Cancel
                            </Button>
                          </>
                        )}
                        {consultation.status === 'in_progress' && (
                          <Button size="sm" onClick={() => handleEndConsultation(consultation.id)}>
                            End
                          </Button>
                        )}
                        {consultation.status === 'completed' && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FreelancerLayout>
  )
} 