'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Clock, CheckCircle, AlertCircle, MessageCircle, FileText, User, Calendar, Star, Eye, MessageSquare, Search, Filter, Download, Upload } from 'lucide-react'
import FreelancerLayout from '@/components/layout/freelancer-layout'
import { API_ENDPOINTS } from '@/lib/config'
import { useToastContext } from '@/components/ui/toast-context'

interface Case {
  id: number
  title: string
  description: string
  status: 'pending' | 'active' | 'completed'
  client_id: number
  client_name?: string
  assigned_at: string
  created_at: string
  completed_at?: string
  case_summary_url?: string
  annotated_document_url?: string
  annotation_notes?: string
  priority?: 'low' | 'medium' | 'high'
  expertise_area?: string
  estimated_completion?: string
  unread_messages?: number
  client_email?: string
  client_phone?: string
  case_value?: number
  hours_spent?: number
}

export default function CasesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToastContext()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [expertiseFilter, setExpertiseFilter] = useState('all')

  // Mock data for demonstration
  const mockCases: Case[] = [
    {
      id: 1,
      title: "Employment Contract Review",
      description: "Client needs review of employment contract with potential red flags",
      status: 'active',
      client_id: 101,
      client_name: "John Smith",
      client_email: "john.smith@email.com",
      client_phone: "+1-555-0123",
      assigned_at: "2024-01-15T10:00:00Z",
      created_at: "2024-01-15T09:30:00Z",
      case_summary_url: "/documents/contract-review.pdf",
      priority: 'high',
      expertise_area: 'Employment Law',
      estimated_completion: "2024-01-20",
      unread_messages: 3,
      case_value: 500,
      hours_spent: 2.5
    },
    {
      id: 2,
      title: "Tenant Rights Dispute",
      description: "Landlord attempting illegal eviction, need legal guidance",
      status: 'pending',
      client_id: 102,
      client_name: "Sarah Johnson",
      client_email: "sarah.j@email.com",
      client_phone: "+1-555-0456",
      assigned_at: "2024-01-16T14:00:00Z",
      created_at: "2024-01-16T13:45:00Z",
      priority: 'medium',
      expertise_area: 'Real Estate Law',
      unread_messages: 1,
      case_value: 300
    },
    {
      id: 3,
      title: "Small Claims Court Filing",
      description: "Assistance with filing small claims for unpaid services",
      status: 'completed',
      client_id: 103,
      client_name: "Mike Davis",
      client_email: "mike.davis@email.com",
      client_phone: "+1-555-0789",
      assigned_at: "2024-01-10T11:00:00Z",
      created_at: "2024-01-10T10:30:00Z",
      completed_at: "2024-01-14T16:00:00Z",
      case_summary_url: "/documents/small-claims-filing.pdf",
      annotated_document_url: "/documents/completed-filing.pdf",
      priority: 'low',
      expertise_area: 'Civil Litigation',
      unread_messages: 0,
      case_value: 200,
      hours_spent: 1.5
    },
    {
      id: 4,
      title: "Business Partnership Agreement",
      description: "Drafting partnership agreement for tech startup",
      status: 'active',
      client_id: 104,
      client_name: "Emily Chen",
      client_email: "emily.chen@email.com",
      client_phone: "+1-555-0321",
      assigned_at: "2024-01-17T09:00:00Z",
      created_at: "2024-01-17T08:30:00Z",
      priority: 'high',
      expertise_area: 'Business Law',
      estimated_completion: "2024-01-25",
      unread_messages: 2,
      case_value: 800,
      hours_spent: 4.0
    },
    {
      id: 5,
      title: "Intellectual Property Dispute",
      description: "Trademark infringement case for software company",
      status: 'pending',
      client_id: 105,
      client_name: "Alex Rodriguez",
      client_email: "alex.r@email.com",
      client_phone: "+1-555-0654",
      assigned_at: "2024-01-18T16:00:00Z",
      created_at: "2024-01-18T15:30:00Z",
      priority: 'high',
      expertise_area: 'Intellectual Property',
      unread_messages: 0,
      case_value: 1200
    }
  ]

  useEffect(() => {
      const fetchCases = async () => {
    setLoading(true)
    try {
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
  }, [toast])

  // Filter cases based on search and filters
  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter
    const matchesExpertise = expertiseFilter === 'all' || caseItem.expertise_area === expertiseFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesExpertise
  })

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

  const handleCaseAction = (caseId: number, action: string) => {
    toast({
      title: "Case Action",
      description: `${action} action performed on case #${caseId}`,
    })
  }

  const CaseCard = ({ caseItem }: { caseItem: Case }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{caseItem.title}</h3>
              {getStatusBadge(caseItem.status)}
              {getPriorityBadge(caseItem.priority)}
            </div>
            <p className="text-sm text-gray-600 mb-3">{caseItem.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
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
              {caseItem.case_value && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${caseItem.case_value}
                </div>
              )}
            </div>

            {caseItem.estimated_completion && (
              <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                <Clock className="h-3 w-3" />
                Due: {new Date(caseItem.estimated_completion).toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {caseItem.unread_messages && caseItem.unread_messages > 0 && (
              <Badge variant="destructive" className="text-xs">
                {caseItem.unread_messages} new
              </Badge>
            )}
            {caseItem.hours_spent && (
              <div className="text-xs text-gray-500">
                {caseItem.hours_spent}h spent
              </div>
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
              onClick={() => handleCaseAction(caseItem.id, 'chat')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
            {caseItem.case_summary_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCaseAction(caseItem.id, 'download')}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
            {caseItem.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCaseAction(caseItem.id, 'upload')}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            )}
          </div>
          
          {caseItem.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleCaseAction(caseItem.id, 'accept')}
                className="bg-green-600 hover:bg-green-700"
              >
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCaseAction(caseItem.id, 'decline')}
              >
                Decline
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
      <p className="text-gray-600 mb-4">
        Try adjusting your search criteria or filters to find cases.
      </p>
      <Button variant="outline" onClick={() => {
        setSearchTerm('')
        setStatusFilter('all')
        setPriorityFilter('all')
        setExpertiseFilter('all')
      }}>
        Clear Filters
      </Button>
    </div>
  )

  return (
    <FreelancerLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
            <p className="text-gray-600 mt-1">View and manage all your legal cases</p>
          </div>
          <Button onClick={() => router.push('/freelancer/dashboard')}>
            <Eye className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Expertise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="Employment Law">Employment Law</SelectItem>
                  <SelectItem value="Real Estate Law">Real Estate Law</SelectItem>
                  <SelectItem value="Business Law">Business Law</SelectItem>
                  <SelectItem value="Civil Litigation">Civil Litigation</SelectItem>
                  <SelectItem value="Intellectual Property">Intellectual Property</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>Cases ({filteredCases.length})</CardTitle>
            <p className="text-sm text-gray-600">Showing {filteredCases.length} of {cases.length} cases</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading cases...</p>
              </div>
            ) : filteredCases.length > 0 ? (
              <div className="grid gap-4">
                {filteredCases.map(caseItem => (
                  <CaseCard key={caseItem.id} caseItem={caseItem} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>
    </FreelancerLayout>
  )
} 