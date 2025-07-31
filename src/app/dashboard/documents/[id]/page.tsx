'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToastContext } from '@/components/ui/toast-context'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  XCircle,
  CreditCard,
  Lock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { API_ENDPOINTS } from '@/lib/config'
import { ExportOptions } from '@/components/ExportOptions'
import { useDocumentSecurity } from '@/hooks/useDocumentSecurity'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface DocumentRecord {
  id: string;
  user_id: number;
  template_id: string;
  template_name: string;
  form_data: Record<string, string>;
  generated_document: string;
  document_type: string;
  document_fee: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_session_id?: string;
  payment_intent_id?: string;
  paid_at?: string;
  download_count: number;
  status: string;
  created_at: string;
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToastContext()
  
  const [document, setDocument] = useState<DocumentRecord | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentVerifying, setPaymentVerifying] = useState(false)
  const [documentId, setDocumentId] = useState<string>('')

  const paymentStatus = searchParams.get('payment')
  const sessionId = searchParams.get('session_id')

  // Await params to get documentId
  useEffect(() => {
    const getDocumentId = async () => {
      const resolvedParams = await params
      setDocumentId(resolvedParams.id)
    }
    getDocumentId()
  }, [params])

  // Apply security measures for unpaid documents
  useDocumentSecurity(document?.payment_status === 'paid')

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (!user) {
          router.push('/auth/signin')
          return
        }
      } catch (error) {
        console.error('Error getting user:', error)
        router.push('/auth/signin')
      }
    }

    getUser()
  }, [router])

  useEffect(() => {
    if (user && documentId) {
      fetchDocument()
    }
  }, [user, documentId])

  useEffect(() => {
    // Handle payment success redirect
    if (paymentStatus === 'success' && sessionId && user?.id) {
      handlePaymentSuccess()
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled. You can try again when ready.',
        variant: 'destructive'
      })
    }
  }, [paymentStatus, sessionId, user])

  const fetchDocument = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      console.log('Fetching document:', documentId, 'for user:', user.id)
      
      const response = await fetch(`${API_ENDPOINTS.DOCUMENTS.BASE}/${documentId}?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Document fetch response status:', response.status)

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Document Not Found',
            description: 'The requested document could not be found.',
            variant: 'destructive'
          })
          router.push('/dashboard/documents')
          return
        }
        
        const errorData = await response.json().catch(() => ({}))
        console.error('Document fetch failed:', errorData)
        throw new Error(errorData.error || 'Failed to fetch document')
      }

      const data = await response.json()
      console.log('Document data:', data)
      setDocument(data.document)
    } catch (error) {
      console.error('Error fetching document:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load document details.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, documentId, toast, router])

  const handlePaymentRequired = () => {
    if (!document) return
    
    toast({
      title: 'Payment Required',
      description: 'Please complete payment to view and download this document.',
      variant: 'destructive'
    })
    
    // Redirect to payment or show payment modal
    // For now, we'll just show a toast, but you can implement payment flow here
  }

  const handlePaymentSuccess = useCallback(async () => {
    if (!sessionId || !user?.id) {
      console.log('Missing sessionId or user.id:', { sessionId, userId: user?.id })
      return
    }

    setPaymentVerifying(true)
    try {
      console.log('Verifying payment for session:', sessionId)
      
      // Verify payment with backend
      const response = await fetch(`${API_ENDPOINTS.DOCUMENTS.VERIFY_PAYMENT(documentId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          sessionId: sessionId
        }),
      })

      console.log('Payment verification response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Payment verification failed:', errorData)
        throw new Error(errorData.error || 'Failed to verify payment')
      }

      const data = await response.json()
      console.log('Payment verification response:', data)
      
      if (data.success && data.paid) {
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been verified. You can now download your document.',
          variant: 'default'
        })
        
        // Refresh document data
        await fetchDocument()
      } else {
        toast({
          title: 'Payment Verification Failed',
          description: data.message || 'Payment verification failed. Please contact support.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast({
        title: 'Payment Verification Error',
        description: error.message || 'Failed to verify payment. Please contact support.',
        variant: 'destructive'
      })
    } finally {
      setPaymentVerifying(false)
    }
  }, [sessionId, user?.id, documentId, toast, fetchDocument])



  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Payment Required
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Payment Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  const getTemplateIcon = (templateId: string) => {
    const icons: Record<string, string> = {
      'nda': '📄',
      'service-agreement': '🤝',
      'employment-contract': '👔',
      'privacy-policy': '🔒',
      'terms-of-service': '📋'
    }
    return icons[templateId] || '📄'
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  if (!document) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
            <p className="text-gray-600 mb-4">The requested document could not be found.</p>
            <Button onClick={() => router.push('/dashboard/documents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard/documents')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{document.template_name}</h1>
              <p className="text-gray-600">Document Details</p>
            </div>
          </div>
          {getPaymentStatusBadge(document.payment_status)}
        </div>

        {/* Payment Verification Loading */}
        {paymentVerifying && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Verifying Payment...</p>
                  <p className="text-sm text-blue-700">Please wait while we confirm your payment.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Refresh for Payment Status */}
        {document && document.payment_status !== 'paid' && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">Payment Status</p>
                    <p className="text-sm text-yellow-700">
                      If you&apos;ve completed payment, click refresh to update the status.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchDocument}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Refresh Status'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Details */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTemplateIcon(document.template_id)}</span>
                <div>
                  <CardTitle>{document.template_name}</CardTitle>
                  <CardDescription>
                    Generated on {new Date(document.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {/* Payment Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {document.payment_status === 'paid' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Lock className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {document.payment_status === 'paid' ? 'Document Ready' : 'Payment Required'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {document.payment_status === 'paid' 
                          ? 'Your document is ready for download' 
                          : 'Fee: $' + (document.document_fee / 100).toFixed(2)
                        }
                      </p>
                    </div>
                                     </div>
                   {document.payment_status === 'paid' && (
                     <ExportOptions 
                       document={document}
                       documentId={documentId}
                       userId={user.id}
                       onDownloadComplete={fetchDocument}
                     />
                   )}
                </div>

                {/* Document Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Document Type</p>
                    <p className="text-lg">{document.document_type}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Downloads</p>
                    <p className="text-lg">{document.download_count}</p>
                  </div>
                  {document.paid_at && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Paid On</p>
                      <p className="text-lg">{new Date(document.paid_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                    <p className="text-lg capitalize">{document.status}</p>
                  </div>
                </div>

                {/* Document Preview */}
                {document.generated_document && document.payment_status === 'paid' && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Document Preview</h3>
                    <div 
                      className="p-4 bg-gray-50 rounded-lg border document-secure"
                      onContextMenu={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {document.generated_document}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* Payment Required Message */}
                {document.generated_document && document.payment_status !== 'paid' && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Document Preview</h3>
                    <div className="relative">
                      {/* Blurred Preview */}
                      <div 
                        className="p-4 bg-gray-50 rounded-lg border document-secure document-blur document-watermark"
                        onContextMenu={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {document.generated_document}
                        </pre>
                      </div>
                      
                      {/* Overlay with payment prompt */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white p-6">
                          <Lock className="h-12 w-12 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Document Preview Locked</h3>
                          <p className="mb-4">
                            Complete payment to view and download this document.
                          </p>
                          <Button 
                            onClick={() => handlePaymentRequired()}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay to View Document
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
} 