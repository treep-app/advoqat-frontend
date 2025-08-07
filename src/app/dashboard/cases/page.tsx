'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  MessageCircle, 
  FileText, 
  User, 
  Calendar, 
  Eye, 
  MessageSquare, 
  Upload,
  Download,
  Briefcase,
  ArrowLeft,
  Scale
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { API_ENDPOINTS, BACKEND_URL } from '@/lib/config'
import { useToastContext } from '@/components/ui/toast-context'

interface Case {
  id: number
  title: string
  description: string
  status: 'pending' | 'active' | 'completed'
  client_id: number
  freelancer_id?: number
  freelancer_name?: string
  assigned_at?: string
  created_at: string
  completed_at?: string
  case_summary_url?: string
  annotated_document_url?: string
  priority?: 'low' | 'medium' | 'high'
  expertise_area?: string
  estimated_completion?: string
  unread_messages?: number
  case_value?: number
}

export default function CasesPage() {
  const router = useRouter()
  const { toast } = useToastContext()
  const [user, setUser] = useState<any>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    expertise_area: '',
    priority: 'medium',
    jurisdiction: '',
    case_type: '',
    client_notes: '',
    case_summary_url: '',
    file: null as File | null
  })


  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          fetchCases(user.id)
        } else {
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Error getting user:', error)
        router.push('/auth/signin')
      }
    }

    getUser()
  }, [router])

  const fetchCases = async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.CASES.CLIENT_CASES(userId))
      if (!response.ok) {
        throw new Error('Failed to fetch cases')
      }
      const data = await response.json()
      setCases(data)
    } catch (error) {
      console.error('Error fetching cases:', error)
      toast({
        title: "Error",
        description: "Failed to load your cases. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitCase = async () => {
    if (!newCase.title.trim() || !newCase.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!user || !user.id) {
      toast({
        title: "Authentication Error",
        description: "Please sign in again to submit a case.",
        variant: "destructive",
      })
      router.push('/auth/signin')
      return
    }

    setSubmitting(true)
    try {
      // First, ensure user exists in our database
      const userResponse = await fetch(`${BACKEND_URL}/api/users/ensure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email
        })
      })

      if (!userResponse.ok) {
        throw new Error('Failed to ensure user exists')
      }

      const userData = await userResponse.json()
      console.log('User ensured:', userData)

      const formData = new FormData()
      formData.append('clientId', user.id)
      formData.append('title', newCase.title)
      formData.append('description', newCase.description)
      formData.append('expertiseArea', newCase.expertise_area)
      formData.append('priority', newCase.priority)
      formData.append('jurisdiction', newCase.jurisdiction || '')
      formData.append('caseType', newCase.case_type || '')
      formData.append('clientNotes', newCase.client_notes || '')

      // Log FormData contents
      console.log('Form data entries:')
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value)
      }
      
      // Add file if selected
      if (newCase.file) {
        formData.append('document', newCase.file)
      }

      console.log('Submitting case with user ID:', user.id)
      console.log('Form data:', {
        clientId: user.id,
        title: newCase.title,
        description: newCase.description,
        expertiseArea: newCase.expertise_area,
        priority: newCase.priority,
        hasFile: !!newCase.file
      })

      console.log('requesting to create case ', formData)
      
      // Test the endpoint first
      const testResponse = await fetch(`${BACKEND_URL}/api/cases/test`, {
        method: 'POST',
        body: formData
      })
      
      if (testResponse.ok) {
        const testResult = await testResponse.json()
        console.log('Test endpoint result:', testResult)
      }
      
      const response = await fetch(API_ENDPOINTS.CASES.CREATE, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit case')
      }

      const result = await response.json()
      
      toast({
        title: "Case Submitted",
        description: result.message || "Your case has been submitted successfully. A lawyer will be assigned shortly.",
        variant: "default",
      })

      setNewCase({
        title: '',
        description: '',
        expertise_area: '',
        priority: 'medium',
        jurisdiction: '',
        case_type: '',
        client_notes: '',
        case_summary_url: '',
        file: null
      })
      setShowSubmitDialog(false)

      if (user) {
        fetchCases(user.id)
      }
    } catch (error) {
      console.error('Error submitting case:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit case. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewCase(prev => ({ ...prev, file, case_summary_url: file.name }))
    }
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
              {caseItem.freelancer_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="truncate">{caseItem.freelancer_name}</span>
                </div>
              )}
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
                  <Briefcase className="h-3 w-3" />
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
          
          {caseItem.unread_messages && caseItem.unread_messages > 0 && (
            <Badge variant="destructive" className="text-xs">
              {caseItem.unread_messages} new
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/cases/${caseItem.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/chat/${caseItem.id}`)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Chat
          </Button>
          {caseItem.case_summary_url && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const EmptyState = ({ status }: { status: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Briefcase className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No {status} cases</h3>
      <p className="text-gray-600 mb-4">
        {status === 'all' && "You haven't submitted any legal cases yet."}
        {status === 'active' && "You don't have any active cases at the moment."}
        {status === 'pending' && "No pending cases waiting for lawyer assignment."}
        {status === 'completed' && "No completed cases to display."}
      </p>
      <Button onClick={() => setShowSubmitDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Submit Your First Case
      </Button>
    </div>
  )

  const filteredCases = cases.filter(caseItem => {
    if (activeTab === 'all') return true
    return caseItem.status === activeTab
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Legal Cases</span>
            </div>
            <Button onClick={() => setShowSubmitDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Submit New Case
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Legal Cases</h1>
          <p className="text-gray-600">
            Submit legal cases for review and track their progress with assigned lawyers.
          </p>
        </div>

        {/* Cases Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Case Management</CardTitle>
            <p className="text-sm text-gray-600">View and track your legal cases by status</p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Cases</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading your cases...</p>
                  </div>
                ) : filteredCases.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredCases.map(caseItem => (
                      <CaseCard key={caseItem.id} caseItem={caseItem} />
                    ))}
                  </div>
                ) : (
                  <EmptyState status="all" />
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

        {/* Submit Case Dialog */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit New Legal Case</DialogTitle>
              <DialogDescription>
                Provide details about your legal issue. A qualified lawyer will be assigned to help you.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Case Title *</label>
                <Input
                  placeholder="e.g., Employment Contract Review"
                  value={newCase.title}
                  onChange={(e) => setNewCase({...newCase, title: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description *</label>
                <Textarea
                  placeholder="Describe your legal issue in detail..."
                  value={newCase.description}
                  onChange={(e) => setNewCase({...newCase, description: e.target.value})}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Legal Area</label>
                  <Select value={newCase.expertise_area} onValueChange={(value) => setNewCase({...newCase, expertise_area: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select legal area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employment Law">Employment Law</SelectItem>
                      <SelectItem value="Real Estate Law">Real Estate Law</SelectItem>
                      <SelectItem value="Business Law">Business Law</SelectItem>
                      <SelectItem value="Civil Litigation">Civil Litigation</SelectItem>
                      <SelectItem value="Intellectual Property">Intellectual Property</SelectItem>
                      <SelectItem value="Family Law">Family Law</SelectItem>
                      <SelectItem value="Criminal Law">Criminal Law</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <Select value={newCase.priority} onValueChange={(value) => setNewCase({...newCase, priority: value as 'low' | 'medium' | 'high'})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Document Upload (Optional)</label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="document-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="document-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </span>
                    </Button>
                  </label>
                  {newCase.case_summary_url && (
                    <span className="ml-2 text-xs text-green-600">
                      ✓ {newCase.case_summary_url}
                    </span>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitCase}
                disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {submitting ? 'Submitting...' : 'Submit Case'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
} 