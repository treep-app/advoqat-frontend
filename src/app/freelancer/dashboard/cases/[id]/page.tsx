'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Eye, 
  Download, 
  Upload, 
  MessageCircle, 
  CheckCircle, 
  X, 
  Clock, 
  User, 
  FileText,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import FreelancerLayout from '@/components/layout/freelancer-layout'
import { API_ENDPOINTS, BACKEND_URL } from '@/lib/config'
import { useToastContext } from '@/components/ui/toast-context'

interface Case {
  id: number
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'declined'
  client_id: number
  client_name?: string
  client_email?: string
  freelancer_id?: number
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

export default function CaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToastContext()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState('')
  const [estimatedCompletion, setEstimatedCompletion] = useState('')
  const [caseValue, setCaseValue] = useState(0)
  const [hoursSpent, setHoursSpent] = useState(0)

  const caseId = params.id as string

  useEffect(() => {
    fetchCaseDetails()
  }, [caseId])

  const fetchCaseDetails = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CASES.CASE(caseId))
      if (!response.ok) {
        throw new Error('Failed to fetch case details')
      }
      const data = await response.json()
      setCaseData(data)
      setNotes(data.annotation_notes || '')
      setEstimatedCompletion(data.estimated_completion || '')
      setCaseValue(data.case_value || 0)
      setHoursSpent(data.hours_spent || 0)
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

  const handleStatusUpdate = async (status: string) => {
    if (!caseData) return

    setUpdating(true)
    try {
      const response = await fetch(API_ENDPOINTS.CASES.UPDATE_STATUS(caseId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          notes,
          estimated_completion: estimatedCompletion,
          case_value: caseValue,
          hours_spent: hoursSpent
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update case')
      }

      const result = await response.json()
      setCaseData(result.case)
      
      toast({
        title: "Case Updated",
        description: `Case ${status}ed successfully`,
        variant: "default",
      })
    } catch (error) {
      console.error('Error updating case:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update case",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('document', file)
    formData.append('documentType', 'annotated')

    try {
      const response = await fetch(API_ENDPOINTS.CASES.UPDATE_DOCUMENT(caseId), {
        method: 'PATCH',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload document')
      }

      const result = await response.json()
      setCaseData(result.case)
      
      toast({
        title: "Document Uploaded",
        description: "Document uploaded successfully",
        variant: "default",
      })
    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      })
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

  if (loading) {
    return (
      <FreelancerLayout>
        <div className="p-4 md:p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading case details...</p>
          </div>
        </div>
      </FreelancerLayout>
    )
  }

  if (!caseData) {
    return (
      <FreelancerLayout>
        <div className="p-4 md:p-8">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Case Not Found</h3>
            <p className="text-gray-600 mb-4">The case you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/freelancer/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
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
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/freelancer/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{caseData.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(caseData.status)}
                {getPriorityBadge(caseData.priority)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {caseData.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('active')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Case
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('declined')}
                  disabled={updating}
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline Case
                </Button>
              </>
            )}
            
            {caseData.status === 'active' && (
              <Button
                onClick={() => handleStatusUpdate('completed')}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Case
              </Button>
            )}
            
            <Button variant="outline" onClick={() => router.push(`/freelancer/dashboard/chat/${caseData.id}`)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with Client
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Case Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Details */}
            <Card>
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900 mt-1">{caseData.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Expertise Area</label>
                    <p className="text-gray-900 mt-1">{caseData.expertise_area || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="text-gray-900 mt-1">{new Date(caseData.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{caseData.client_name || 'Unknown Client'}</p>
                    <p className="text-sm text-gray-600">{caseData.client_email || 'No email provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case Management */}
            <Card>
              <CardHeader>
                <CardTitle>Case Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Estimated Completion</label>
                    <Input
                      type="date"
                      value={estimatedCompletion}
                      onChange={(e) => setEstimatedCompletion(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Case Value ($)</label>
                    <Input
                      type="number"
                      value={caseValue}
                      onChange={(e) => setCaseValue(parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Hours Spent</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes about this case..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseData.case_summary_url && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Case Summary</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
                
                {caseData.annotated_document_url && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Annotated Document</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload Annotated Document</p>
                  <input
                    type="file"
                    id="document-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                  <label htmlFor="document-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/freelancer/dashboard/chat/${caseData.id}`)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat with Client
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Consultation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Update Billing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FreelancerLayout>
  )
} 