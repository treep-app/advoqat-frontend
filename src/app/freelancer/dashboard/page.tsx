'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Clock, CheckCircle, AlertCircle, MessageCircle, FileText, User, Calendar, Star, Eye, MessageSquare, X, Timer, MapPin, Briefcase } from 'lucide-react'
import FreelancerLayout from '@/components/layout/freelancer-layout'
import { API_ENDPOINTS } from '@/lib/config'
import { useToastContext } from '@/components/ui/toast-context'

interface Case {
  id: number
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'declined'
  client_id: number
  client_name?: string
  assigned_at: string
  created_at: string
  case_summary_url?: string
  annotated_document_url?: string
  annotation_notes?: string
  priority?: 'low' | 'medium' | 'high'
  expertise_area?: string
  estimated_completion?: string
  unread_messages?: number
  time_remaining?: number // 24-hour timer in seconds
  jurisdiction?: string
  case_type?: string
  client_notes?: string
  auto_generated_docs?: string[]
}

export default function FreelancerDashboard() {
  const router = useRouter()
  const { toast } = useToastContext()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    completed: 0,
    earnings: 0
  })

  // Timer for pending cases
  const [timers, setTimers] = useState<{ [key: number]: number }>({})

  // Timer component for countdown display
  const CaseTimer = ({ caseItem }: { caseItem: Case }) => {
    const [timeLeft, setTimeLeft] = useState(caseItem.time_remaining || 0)

    useEffect(() => {
      if (caseItem.status !== 'pending' || !timeLeft) return

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-decline case if time expires
            handleCaseAction(caseItem.id, 'decline')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }, [caseItem.status, timeLeft])

    if (caseItem.status !== 'pending' || !timeLeft) return null

    const hours = Math.floor(timeLeft / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    const seconds = timeLeft % 60

    return (
      <div className="flex items-center gap-1 text-xs">
        <Timer className="h-3 w-3 text-orange-500" />
        <span className={`font-medium ${timeLeft < 3600 ? 'text-red-600' : 'text-orange-600'}`}>
          {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    )
  }

  // Mock data for demonstration
  const mockCases: Case[] = [
    {
      id: 1,
      title: "Employment Contract Review",
      description: "Client needs review of employment contract with potential red flags",
      status: 'active',
      client_id: 101,
      client_name: "John Smith",
      assigned_at: "2024-01-15T10:00:00Z",
      created_at: "2024-01-15T09:30:00Z",
      case_summary_url: "/documents/contract-review.pdf",
      priority: 'high',
      expertise_area: 'Employment Law',
      estimated_completion: "2024-01-20",
      unread_messages: 3
    },
    {
      id: 2,
      title: "Tenant Rights Dispute",
      description: "Landlord attempting illegal eviction, need legal guidance",
      status: 'pending',
      client_id: 102,
      client_name: "Sarah Johnson",
      assigned_at: "2024-01-16T14:00:00Z",
      created_at: "2024-01-16T13:45:00Z",
      priority: 'medium',
      expertise_area: 'Real Estate Law',
      unread_messages: 1
    },
    {
      id: 3,
      title: "Small Claims Court Filing",
      description: "Assistance with filing small claims for unpaid services",
      status: 'completed',
      client_id: 103,
      client_name: "Mike Davis",
      assigned_at: "2024-01-10T11:00:00Z",
      created_at: "2024-01-10T10:30:00Z",
      completed_at: "2024-01-14T16:00:00Z",
      case_summary_url: "/documents/small-claims-filing.pdf",
      annotated_document_url: "/documents/completed-filing.pdf",
      priority: 'low',
      expertise_area: 'Civil Litigation',
      unread_messages: 0
    },
    {
      id: 4,
      title: "Business Partnership Agreement",
      description: "Drafting partnership agreement for tech startup",
      status: 'active',
      client_id: 104,
      client_name: "Emily Chen",
      assigned_at: "2024-01-17T09:00:00Z",
      created_at: "2024-01-17T08:30:00Z",
      priority: 'high',
      expertise_area: 'Business Law',
      estimated_completion: "2024-01-25",
      unread_messages: 2
    }
  ]

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true)
      try {
        // Get userId from localStorage or session
        const userId = localStorage.getItem('userId')
        if (!userId) {
          throw new Error('User ID not found')
        }

        const response = await fetch(API_ENDPOINTS.CASES.FREELANCER_CASES(userId))
        if (!response.ok) {
          throw new Error('Failed to fetch cases')
        }
        const data = await response.json()
        setCases(data)
        
        // Calculate stats
        const activeCount = data.filter((c: Case) => c.status === 'active').length
        const pendingCount = data.filter((c: Case) => c.status === 'pending').length
        const completedCount = data.filter((c: Case) => c.status === 'completed').length
        
        setStats({
          active: activeCount,
          pending: pendingCount,
          completed: completedCount,
          earnings: 1250 // Mock earnings for now
        })

        // Show notifications for new cases with timer
        const newCases = data.filter((c: Case) => c.status === 'pending')
        if (newCases.length > 0) {
          newCases.forEach((caseItem: Case) => {
            if (caseItem.time_remaining && caseItem.time_remaining > 0) {
              const hoursLeft = Math.floor(caseItem.time_remaining / 3600)
              const minutesLeft = Math.floor((caseItem.time_remaining % 3600) / 60)
              
              toast({
                title: `New Case: ${caseItem.title}`,
                description: `You have ${hoursLeft}h ${minutesLeft}m to review this case. Click "Review Docs" to examine details.`,
                variant: "default",
                duration: 10000, // Show for 10 seconds
              })
            }
          })
        }
      } catch (error) {
        console.error('Error fetching cases:', error)
        toast({
          title: "Error",
          description: "Failed to load cases. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
    
    // Set up polling for new cases every 30 seconds
    const interval = setInterval(fetchCases, 30000)
    
    return () => clearInterval(interval)
  }, [toast])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Priority</Badge>
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium Priority</Badge>
      case 'low':
        return <Badge variant="outline" className="text-xs">Low Priority</Badge>
      default:
        return null
    }
  }

  const handleCaseAction = async (caseId: number, action: string) => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        throw new Error('User ID not found')
      }

      let endpoint = ''
      let method = 'PATCH'
      let body = {}
      let actionText = ''

      switch (action) {
        case 'accept':
          endpoint = API_ENDPOINTS.CASES.UPDATE_STATUS(caseId.toString())
          body = { status: 'active', notes: 'Case accepted by lawyer' }
          actionText = 'accepted'
          break
        case 'decline':
          endpoint = API_ENDPOINTS.CASES.UPDATE_STATUS(caseId.toString())
          body = { status: 'declined', notes: 'Case declined by lawyer' }
          actionText = 'declined'
          break
        case 'complete':
          endpoint = API_ENDPOINTS.CASES.UPDATE_STATUS(caseId.toString())
          body = { status: 'completed', notes: 'Case completed by lawyer' }
          actionText = 'completed'
          break
        case 'chat':
          router.push(`/freelancer/dashboard/chat/${caseId}`)
          return
        default:
          toast({
            title: "Invalid Action",
            description: "Unknown action requested",
            variant: "destructive",
          })
          return
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update case status')
      }

      const result = await response.json()
      
      // Show success toast with appropriate message
      toast({
        title: "Case Updated Successfully",
        description: `Case has been ${actionText}. The client will be notified.`,
        variant: "default",
      })

      // Refresh cases
      const fetchCases = async () => {
        try {
          const response = await fetch(API_ENDPOINTS.CASES.FREELANCER_CASES(userId))
          if (!response.ok) {
            throw new Error('Failed to fetch cases')
          }
          const data = await response.json()
          setCases(data)
          
          // Recalculate stats
          const activeCount = data.filter((c: Case) => c.status === 'active').length
          const pendingCount = data.filter((c: Case) => c.status === 'pending').length
          const completedCount = data.filter((c: Case) => c.status === 'completed').length
          
          setStats({
            active: activeCount,
            pending: pendingCount,
            completed: completedCount,
            earnings: 1250 // Mock earnings for now
          })
        } catch (error) {
          console.error('Error refreshing cases:', error)
        }
      }
      
      fetchCases()
    } catch (error) {
      console.error('Error updating case:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update case status",
        variant: "destructive",
      })
    }
  }

  const CaseCard = ({ caseItem }: { caseItem: Case }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{caseItem.title}</h3>
              {getStatusBadge(caseItem.status)}
              {getPriorityBadge(caseItem.priority)}
              {caseItem.status === 'pending' && <CaseTimer caseItem={caseItem} />}
            </div>
            <p className="text-sm text-gray-600 mb-2">{caseItem.description}</p>
            
            {/* Case metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate">{caseItem.client_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(caseItem.created_at).toLocaleDateString()}
              </div>
              {caseItem.expertise_area && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span className="truncate">{caseItem.expertise_area}</span>
                </div>
              )}
              {caseItem.jurisdiction && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{caseItem.jurisdiction}</span>
                </div>
              )}
            </div>

            {/* Case type and client notes */}
            {caseItem.case_type && (
              <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                <Briefcase className="h-3 w-3" />
                {caseItem.case_type}
              </div>
            )}
            
            {caseItem.client_notes && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-2">
                <strong>Client Notes:</strong> {caseItem.client_notes}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {caseItem.unread_messages && caseItem.unread_messages > 0 && (
              <Badge variant="destructive" className="text-xs">
                {caseItem.unread_messages} new
              </Badge>
            )}
            {caseItem.auto_generated_docs && caseItem.auto_generated_docs.length > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                {caseItem.auto_generated_docs.length} docs
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/freelancer/dashboard/cases/${caseItem.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/freelancer/dashboard/cases/${caseItem.id}/documents`)}
            >
              <FileText className="h-4 w-4 mr-1" />
              Review Docs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/freelancer/dashboard/chat/${caseItem.id}`)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/freelancer/dashboard/consultations`)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Schedule Consultation
            </Button>
          </div>
          {caseItem.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleCaseAction(caseItem.id, 'accept')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleCaseAction(caseItem.id, 'decline')}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          )}
          
          {caseItem.status === 'active' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleCaseAction(caseItem.id, 'complete')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const EmptyState = ({ status }: { status: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No {status} cases</h3>
      <p className="text-gray-600 mb-4">
        {status === 'active' && "You don't have any active cases at the moment."}
        {status === 'pending' && "No pending cases waiting for your review."}
        {status === 'completed' && "No completed cases to display."}
      </p>
      <Button variant="outline" onClick={() => router.push('/freelancer/dashboard/cases')}>
        View All Cases
      </Button>
    </div>
  )

  return (
    <FreelancerLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case Overview</h1>
            <p className="text-gray-600 mt-1">Manage your legal cases and client communications</p>
          </div>
          <Button onClick={() => router.push('/freelancer/dashboard/cases')}>
            <Eye className="h-4 w-4 mr-2" />
            View All Cases
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.earnings}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Cases Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Case Management</CardTitle>
            <p className="text-sm text-gray-600">View and manage your cases by status</p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Active ({stats.active})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Completed ({stats.completed})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading active cases...</p>
                  </div>
                ) : cases.filter(c => c.status === 'active').length > 0 ? (
                  <div className="grid gap-4">
                    {cases.filter(c => c.status === 'active').map(caseItem => (
                      <CaseCard key={caseItem.id} caseItem={caseItem} />
                    ))}
                  </div>
                ) : (
                  <EmptyState status="active" />
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading pending cases...</p>
                  </div>
                ) : cases.filter(c => c.status === 'pending').length > 0 ? (
                  <div className="grid gap-4">
                    {cases.filter(c => c.status === 'pending').map(caseItem => (
                      <CaseCard key={caseItem.id} caseItem={caseItem} />
                    ))}
                  </div>
                ) : (
                  <EmptyState status="pending" />
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading completed cases...</p>
                  </div>
                ) : cases.filter(c => c.status === 'completed').length > 0 ? (
                  <div className="grid gap-4">
                    {cases.filter(c => c.status === 'completed').map(caseItem => (
                      <CaseCard key={caseItem.id} caseItem={caseItem} />
                    ))}
                  </div>
                ) : (
                  <EmptyState status="completed" />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </FreelancerLayout>
  )
} 