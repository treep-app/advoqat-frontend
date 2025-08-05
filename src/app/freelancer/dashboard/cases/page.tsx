'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar,
  DollarSign,
  Eye,
  Download,
  Edit
} from 'lucide-react'
import FreelancerLayout from '@/components/layout/freelancer-layout'
import { API_ENDPOINTS } from '@/lib/config'
import DocumentAnnotationModal from '@/components/document-annotation-modal'

interface Case {
  id: number
  title: string
  description: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  client_name: string
  client_email: string
  client_phone: string
  case_type: string
  budget: number
  deadline: string
  created_at: string
  accepted_at?: string
  declined_at?: string
  completed_at?: string
  annotated_document_url?: string
  annotation_notes?: string
  freelancer_id: number
}

export default function CaseInboxPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [annotationModalOpen, setAnnotationModalOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(storedUserId)
      fetchCases(storedUserId)
    }
  }, [])

  const fetchCases = async (id: string) => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(API_ENDPOINTS.FREELANCERS.CASES(id))
      if (response.ok) {
        const data = await response.json()
        setCases(data)
      } else {
        setError('Failed to fetch cases')
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
      setError('Failed to fetch cases')
    } finally {
      setLoading(false)
    }
  }

  const handleCaseAction = async (caseId: number, action: 'accept' | 'decline' | 'complete') => {
    try {
      setActionLoading(caseId)
      setError('')

      const endpoint = action === 'accept' 
        ? API_ENDPOINTS.FREELANCERS.ACCEPT_CASE(caseId.toString())
        : action === 'decline'
        ? API_ENDPOINTS.FREELANCERS.DECLINE_CASE(caseId.toString())
        : API_ENDPOINTS.FREELANCERS.COMPLETE_CASE(caseId.toString())

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        // Refresh cases after action
        if (userId) {
          fetchCases(userId)
        }
      } else {
        setError(`Failed to ${action} case`)
      }
    } catch (error) {
      console.error(`Error ${action}ing case:`, error)
      setError(`Failed to ${action} case`)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case 'accepted':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Accepted</Badge>
      case 'declined':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Declined</Badge>
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const getFilteredCases = (status: string) => {
    if (status === 'all') return cases
    return cases.filter(c => c.status === status)
  }

  if (loading) {
    return (
      <FreelancerLayout>
        <div className="p-4 md:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-4">Loading Cases...</h1>
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
            <h1 className="text-3xl font-bold text-gray-900">Case Inbox</h1>
            <p className="text-gray-600">Manage your assigned cases and client requests</p>
          </div>
          <Button onClick={() => userId && fetchCases(userId)}>
            <Clock className="h-4 w-4 mr-2" />
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
                  <p className="text-sm text-gray-600">Total Cases</p>
                  <p className="text-2xl font-bold">{cases.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{cases.filter(c => c.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">{cases.filter(c => c.status === 'accepted').length}</p>
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
                  <p className="text-2xl font-bold">{cases.filter(c => c.status === 'completed').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cases Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Cases</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>

          {['all', 'pending', 'accepted', 'completed', 'declined'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {getFilteredCases(status).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                    <p className="text-gray-600">
                      {status === 'all' 
                        ? "You don't have any cases yet."
                        : `No ${status} cases found.`
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {getFilteredCases(status).map((caseItem) => (
                    <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{caseItem.title}</h3>
                              {getStatusBadge(caseItem.status)}
                            </div>
                            <p className="text-gray-600 mb-3">{caseItem.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">Client:</span>
                                <span>{caseItem.client_name}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">Budget:</span>
                                <span>{formatCurrency(caseItem.budget)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">Deadline:</span>
                                <span>{formatDate(caseItem.deadline)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">Type:</span>
                                <span>{caseItem.case_type}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Created: {formatDate(caseItem.created_at)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {caseItem.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleCaseAction(caseItem.id, 'accept')}
                                  disabled={actionLoading === caseItem.id}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {actionLoading === caseItem.id ? 'Accepting...' : 'Accept'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCaseAction(caseItem.id, 'decline')}
                                  disabled={actionLoading === caseItem.id}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  {actionLoading === caseItem.id ? 'Declining...' : 'Decline'}
                                </Button>
                              </>
                            )}
                            
                            {caseItem.status === 'accepted' && (
                              <Button
                                size="sm"
                                onClick={() => handleCaseAction(caseItem.id, 'complete')}
                                disabled={actionLoading === caseItem.id}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {actionLoading === caseItem.id ? 'Completing...' : 'Mark Complete'}
                              </Button>
                            )}
                            
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            
                                                         {caseItem.status === 'accepted' && (
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => {
                                   setSelectedCase(caseItem)
                                   setAnnotationModalOpen(true)
                                 }}
                               >
                                 <Edit className="h-4 w-4 mr-1" />
                                 Annotate
                               </Button>
                             )}
                             
                             {caseItem.annotated_document_url && (
                               <Button size="sm" variant="ghost">
                                 <Download className="h-4 w-4 mr-1" />
                                 Download
                               </Button>
                             )}
                          </div>
                        </div>
                        
                        {caseItem.annotation_notes && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 mb-1">Annotation Notes:</p>
                            <p className="text-sm text-blue-800">{caseItem.annotation_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Document Annotation Modal */}
      {selectedCase && (
        <DocumentAnnotationModal
          isOpen={annotationModalOpen}
          onClose={() => {
            setAnnotationModalOpen(false)
            setSelectedCase(null)
          }}
          caseId={selectedCase.id}
          caseTitle={selectedCase.title}
          onAnnotationComplete={() => {
            // Refresh cases after annotation
            if (userId) {
              fetchCases(userId)
            }
          }}
        />
      )}
    </FreelancerLayout>
  )
} 