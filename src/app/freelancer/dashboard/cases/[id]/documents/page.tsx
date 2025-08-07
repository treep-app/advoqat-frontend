'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, FileText, Download, Eye, CheckCircle, X, Clock, User, MessageSquare, AlertCircle, ExternalLink } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { useToast } from '@/components/ui/use-toast'

interface Case {
  id: number
  title: string
  description: string
  status: string
  client_name?: string
  freelancer_name?: string
  created_at: string
  case_summary_url?: string
  annotated_document_url?: string
  annotation_notes?: string
  priority?: string
  expertise_area?: string
  jurisdiction?: string
  case_type?: string
  client_notes?: string
  auto_generated_docs?: string[]
  time_remaining?: number
}

interface Document {
  id: string
  name: string
  type: 'original' | 'auto_generated' | 'annotated'
  url: string
  size: string
  uploaded_at: string
  description?: string
}

export default function DocumentReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const caseId = params.id as string
  
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const fetchCaseAndDocuments = async () => {
      try {
        // Fetch case documents from the new API endpoint
        const documentsResponse = await fetch(API_ENDPOINTS.DOCUMENTS.GET_CASE_DOCUMENTS(caseId))
        if (!documentsResponse.ok) {
          throw new Error('Failed to fetch case documents')
        }
        const data = await documentsResponse.json()
        
        setCaseData(data.case)
        setDocuments(data.documents)
        setTimeLeft(data.case.time_remaining || 0)
      } catch (error) {
        console.error('Error fetching case and documents:', error)
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (caseId) {
      fetchCaseAndDocuments()
    }
  }, [caseId, toast])

  // Timer countdown
  useEffect(() => {
    if (!timeLeft || caseData?.status !== 'pending') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-decline case if time expires
          handleCaseAction('decline')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, caseData?.status])

  const handleCaseAction = async (action: 'accept' | 'decline') => {
    try {
      const response = await fetch(API_ENDPOINTS.CASES.UPDATE_STATUS(caseId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: action === 'accept' ? 'active' : 'declined',
          notes: `Case ${action}ed after document review`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update case status')
      }

      toast({
        title: `Case ${action === 'accept' ? 'Accepted' : 'Declined'}`,
        description: `Case has been ${action}ed successfully.`,
        variant: "default",
      })

      router.push('/freelancer/dashboard')
    } catch (error) {
      console.error('Error updating case:', error)
      toast({
        title: "Error",
        description: "Failed to update case status",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      // Get download URL from API
      const response = await fetch(API_ENDPOINTS.DOCUMENTS.DOWNLOAD_DOCUMENT(caseId, doc.id))
      if (!response.ok) {
        throw new Error('Failed to get download URL')
      }
      
      const data = await response.json()
      
      // Create download link
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = data.documentName || doc.name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download Started",
        description: "Document download has begun",
        variant: "default",
      })
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({
        title: "Download Error",
        description: "Failed to download document",
        variant: "destructive",
      })
    }
  }

  const handlePreview = (doc: Document) => {
    setSelectedDoc(doc)
    // In real app, open document preview modal
    window.open(doc.url, '_blank')
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDocumentTypeBadge = (type: string) => {
    switch (type) {
      case 'original':
        return <Badge variant="outline" className="text-xs">Original</Badge>
      case 'auto_generated':
        return <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">Auto-Generated</Badge>
      case 'annotated':
        return <Badge variant="secondary" className="text-xs">Annotated</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading documents...</p>
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
          <p className="text-gray-600 mb-4">The case you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/freelancer/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/freelancer/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Review</h1>
            <p className="text-gray-600">{caseData.title}</p>
          </div>
        </div>
        
        {/* Timer */}
        {caseData.status === 'pending' && timeLeft > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              Time remaining: {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Case Summary
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
                      <User className="h-4 w-4 text-gray-500" />
                      <span>Client: {caseData.client_name}</span>
                    </div>
                    {caseData.expertise_area && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>Area: {caseData.expertise_area}</span>
                      </div>
                    )}
                    {caseData.jurisdiction && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>Jurisdiction: {caseData.jurisdiction}</span>
                      </div>
                    )}
                    {caseData.case_type && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>Type: {caseData.case_type}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Client Notes</h4>
                  {caseData.client_notes ? (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {caseData.client_notes}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No additional notes provided</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Case Documents
              </CardTitle>
              <p className="text-sm text-gray-600">Review all documents before making a decision</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{doc.name}</h4>
                          {getDocumentTypeBadge(doc.type)}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{doc.size}</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Case Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">Review all documents and case details before making your decision.</p>
                {caseData.status === 'pending' && timeLeft > 0 && (
                  <p className="text-orange-600 font-medium">
                    ⏰ You have {formatTime(timeLeft)} to respond
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleCaseAction('accept')}
                  disabled={caseData.status !== 'pending'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Case
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleCaseAction('decline')}
                  disabled={caseData.status !== 'pending'}
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline Case
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Case Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Document Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Documents:</span>
                  <span className="font-medium">{documents.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Original Documents:</span>
                  <span className="font-medium">
                    {documents.filter(d => d.type === 'original').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Auto-Generated:</span>
                  <span className="font-medium">
                    {documents.filter(d => d.type === 'auto_generated').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/freelancer/dashboard/chat/${caseId}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Client
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/freelancer/dashboard/cases/${caseId}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Case Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 