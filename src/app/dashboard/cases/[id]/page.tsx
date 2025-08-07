'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MessageSquare, FileText, Calendar, User, DollarSign, Clock, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { useToast } from '@/components/ui/use-toast'

interface Case {
  id: number
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'declined'
  client_id: number
  client_name?: string
  freelancer_id?: number
  freelancer_name?: string
  freelancer_email?: string
  assigned_at?: string
  created_at: string
  completed_at?: string
  case_summary_url?: string
  annotated_document_url?: string
  annotation_notes?: string
  priority?: 'low' | 'medium' | 'high'
  expertise_area?: string
  estimated_completion?: string
  case_value?: number
  hours_spent?: number
}

export default function ClientCaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const caseId = params.id as string
  
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.CASES.CASE(caseId))
        if (!response.ok) {
          throw new Error('Failed to fetch case details')
        }
        const data = await response.json()
        setCaseData(data)
      } catch (error) {
        console.error('Error fetching case details:', error)
        toast({
          title: "Error",
          description: "Failed to load case details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (caseId) {
      fetchCaseDetails()
    }
  }, [caseId, toast])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending Review</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
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

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading case details...</p>
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Case Not Found</h3>
          <p className="text-gray-600 mb-4">The case you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.push('/dashboard/cases')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/cases')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(caseData.status)}
            {getPriorityBadge(caseData.priority)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/dashboard/chat/${caseData.id}`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat with Lawyer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Case Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{caseData.description}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Case Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Created: {new Date(caseData.created_at).toLocaleDateString()}</span>
                    </div>
                    {caseData.assigned_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Assigned: {new Date(caseData.assigned_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {caseData.completed_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Completed: {new Date(caseData.completed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {caseData.expertise_area && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>Area: {caseData.expertise_area}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Progress & Billing</h4>
                  <div className="space-y-2 text-sm">
                    {caseData.estimated_completion && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Est. Completion: {new Date(caseData.estimated_completion).toLocaleDateString()}</span>
                      </div>
                    )}
                    {caseData.case_value && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span>Case Value: ${caseData.case_value}</span>
                      </div>
                    )}
                    {caseData.hours_spent && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>Hours Spent: {caseData.hours_spent}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lawyer Notes */}
          {caseData.annotation_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Lawyer Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{caseData.annotation_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Lawyer */}
          {caseData.freelancer_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assigned Lawyer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{caseData.freelancer_name}</h4>
                    {caseData.freelancer_email && (
                      <p className="text-sm text-gray-600">{caseData.freelancer_email}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/chat/${caseData.id}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Lawyer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {caseData.case_summary_url && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm">Case Summary</h4>
                      <p className="text-xs text-gray-500">Original case document</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(caseData.case_summary_url!, 'case-summary.pdf')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {caseData.annotated_document_url && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm">Annotated Document</h4>
                      <p className="text-xs text-gray-500">Lawyer's reviewed version</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(caseData.annotated_document_url!, 'annotated-document.pdf')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {!caseData.case_summary_url && !caseData.annotated_document_url && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No documents uploaded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push(`/dashboard/chat/${caseData.id}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/cases')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Cases
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 