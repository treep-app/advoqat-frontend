'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToastContext } from '@/components/ui/toast-context'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Grid3X3, 
  List, 
  ArrowRight, 
  Download, 
  Copy, 
  Eye, 
  CheckCircle, 
  Clock, 
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  MoreVertical,
  Clock4,
  CreditCard,
  Lock,
  DollarSign,
  AlertCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { API_ENDPOINTS } from '@/lib/config'

import { User } from '@supabase/supabase-js';

interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  fields: DocumentField[]
  color: string
  gradient: string
}

interface DocumentField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'date' | 'email' | 'phone'
  required: boolean
  placeholder?: string
  options?: string[]
}

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

const documentTemplates: DocumentTemplate[] = [
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    description: 'Protect confidential information with a legally binding NDA',
    category: 'Business',
    icon: '📄',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name' },
      { name: 'companyJurisdiction', label: 'Company Jurisdiction', type: 'text', required: true, placeholder: 'Enter company jurisdiction (e.g., California, USA)' },
      { name: 'recipientName', label: 'Recipient Name', type: 'text', required: true, placeholder: 'Enter recipient name' },
      { name: 'recipientEmail', label: 'Recipient Email', type: 'email', required: true, placeholder: 'Enter recipient email' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { name: 'confidentialInfo', label: 'Confidential Information', type: 'textarea', required: true, placeholder: 'Describe the confidential information' },
      { name: 'duration', label: 'Agreement Duration', type: 'select', required: true, options: ['1 year', '2 years', '3 years', '5 years', 'Indefinite'] }
    ]
  },
  {
    id: 'employment-contract',
    name: 'Employment Contract',
    description: 'Create a comprehensive employment agreement',
    category: 'Employment',
    icon: '👔',
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    fields: [
      { name: 'employerName', label: 'Employer Name', type: 'text', required: true, placeholder: 'Enter employer name' },
      { name: 'employerJurisdiction', label: 'Employer Jurisdiction', type: 'text', required: true, placeholder: 'Enter employer jurisdiction (e.g., California, USA)' },
      { name: 'employeeName', label: 'Employee Name', type: 'text', required: true, placeholder: 'Enter employee name' },
      { name: 'jobTitle', label: 'Job Title', type: 'text', required: true, placeholder: 'Enter job title' },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'salary', label: 'Annual Salary', type: 'text', required: true, placeholder: 'Enter annual salary' },
      { name: 'workLocation', label: 'Work Location', type: 'text', required: true, placeholder: 'Enter work location' },
      { name: 'jobDescription', label: 'Job Description', type: 'textarea', required: true, placeholder: 'Describe the job responsibilities' }
    ]
  },
  {
    id: 'rental-agreement',
    name: 'Rental Agreement',
    description: 'Generate a residential or commercial lease agreement',
    category: 'Real Estate',
    icon: '🏠',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    fields: [
      { name: 'landlordName', label: 'Landlord Name', type: 'text', required: true, placeholder: 'Enter landlord name' },
      { name: 'tenantName', label: 'Tenant Name', type: 'text', required: true, placeholder: 'Enter tenant name' },
      { name: 'propertyAddress', label: 'Property Address', type: 'textarea', required: true, placeholder: 'Enter property address' },
      { name: 'rentAmount', label: 'Monthly Rent', type: 'text', required: true, placeholder: 'Enter monthly rent amount' },
      { name: 'leaseStart', label: 'Lease Start Date', type: 'date', required: true },
      { name: 'leaseEnd', label: 'Lease End Date', type: 'date', required: true },
      { name: 'securityDeposit', label: 'Security Deposit', type: 'text', required: true, placeholder: 'Enter security deposit amount' },
      { name: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: true, placeholder: 'Enter jurisdiction (e.g., California, USA)' }
    ]
  },
  {
    id: 'service-agreement',
    name: 'Service Agreement',
    description: 'Create a contract for professional services',
    category: 'Business',
    icon: '🤝',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    fields: [
      { name: 'serviceProvider', label: 'Service Provider', type: 'text', required: true, placeholder: 'Enter service provider name' },
      { name: 'providerJurisdiction', label: 'Provider Jurisdiction', type: 'text', required: true, placeholder: 'Enter provider jurisdiction (e.g., California, USA)' },
      { name: 'clientName', label: 'Client Name', type: 'text', required: true, placeholder: 'Enter client name' },
      { name: 'serviceDescription', label: 'Service Description', type: 'textarea', required: true, placeholder: 'Describe the services to be provided' },
      { name: 'serviceFee', label: 'Service Fee', type: 'text', required: true, placeholder: 'Enter service fee' },
      { name: 'startDate', label: 'Service Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'Service End Date', type: 'date', required: true },
      { name: 'paymentTerms', label: 'Payment Terms', type: 'select', required: true, options: ['Net 30', 'Net 60', 'Upon completion', 'Monthly', 'Weekly'] }
    ]
  }
]

export default function DocumentsPage() {
  const router = useRouter()
  const { toast } = useToastContext()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null)
  const [userDocuments, setUserDocuments] = useState<DocumentRecord[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  // Payment-related state
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDocumentForPayment, setSelectedDocumentForPayment] = useState<DocumentRecord | null>(null)
  const [showGeneratedDocumentPaymentModal, setShowGeneratedDocumentPaymentModal] = useState(false)
  const [savedDocumentPayment, setSavedDocumentPayment] = useState<{
    type: 'existing_document' | 'generated_document';
    documentId: string;
    templateName: string;
    documentFee: number;
    formData: Record<string, string>;
    document?: DocumentRecord;
    template?: DocumentTemplate;
    timestamp: number;
    expiresAt: number;
  } | null>(null)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/signin')
          return
        }
        
        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('Error getting user:', err)
        router.push('/auth/signin')
      }
    }

    getUser()
  }, [router])

  const fetchDocuments = async () => {
    if (!user?.id) return
    
    setDocsLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.DOCUMENTS.USER_DOCUMENTS}?userId=${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setUserDocuments((data.documents || []) as DocumentRecord[])
      } else {
        console.error('Failed to fetch user documents:', data.error)
      }
    } catch (err) {
      console.error('Failed to fetch user documents', err)
    } finally {
      setDocsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  // Document payment persistence functions
  const saveDocumentPaymentJourney = (journeyData: {
    type: 'existing_document' | 'generated_document';
    documentId: string;
    templateName: string;
    documentFee: number;
    formData: Record<string, string>;
    document?: DocumentRecord;
    template?: DocumentTemplate;
    generatedDocument?: string;
  }) => {
    const journey = {
      ...journeyData,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    localStorage.setItem('legaliq_document_payment_journey', JSON.stringify(journey))
    setSavedDocumentPayment(journey)
  }

  const loadDocumentPaymentJourney = () => {
    const saved = localStorage.getItem('legaliq_document_payment_journey')
    if (saved) {
      const journey = JSON.parse(saved)
      // Check if journey is still valid (not expired)
      if (journey.expiresAt > Date.now()) {
        setSavedDocumentPayment(journey)
        return journey
      } else {
        // Clear expired journey
        localStorage.removeItem('legaliq_document_payment_journey')
        setSavedDocumentPayment(null)
      }
    }
    return null
  }

  const clearDocumentPaymentJourney = () => {
    localStorage.removeItem('legaliq_document_payment_journey')
    setSavedDocumentPayment(null)
  }

  const continueDocumentPaymentJourney = async (journey: {
    type: 'existing_document' | 'generated_document';
    documentId: string;
    templateName: string;
    documentFee: number;
    formData: Record<string, string>;
    document?: DocumentRecord;
    template?: DocumentTemplate;
    generatedDocument?: string;
    timestamp: number;
    expiresAt: number;
  }) => {
    try {
      setPaymentLoading(journey.documentId || 'generated')
      
      if (journey.documentId && journey.documentId !== 'temp') {
        // Restore document payment
        if (journey.document) {
          setSelectedDocumentForPayment(journey.document)
          setShowPaymentModal(true)
        }
      } else {
        // Restore generated document payment
        if (journey.template) {
          setSelectedTemplate(journey.template)
          setFormData(journey.formData)
          setGeneratedDocument(journey.generatedDocument || null)
          setShowGeneratedDocumentPaymentModal(true)
        }
      }
      
      // Clear the saved journey since we're continuing it
      clearDocumentPaymentJourney()
      
      toast({
        title: "Payment Journey Restored",
        description: "Your document payment details have been restored. You can continue with payment.",
      })
    } catch (error) {
      console.error('Error continuing document payment journey:', error)
      toast({
        title: 'Error',
        description: 'Could not restore payment journey. Please start a new payment.',
        variant: 'destructive'
      })
    } finally {
      setPaymentLoading(null)
    }
  }

  // Handle payment success for generated documents
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')
    const isGenerated = searchParams.get('generated')

    if (paymentStatus === 'success' && sessionId && isGenerated === 'true') {
      handleGeneratedDocumentPaymentSuccess(sessionId)
      // Clear any saved payment journey
      clearDocumentPaymentJourney()
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled. You can continue later from your saved payment.',
        variant: 'destructive'
      })
    }
  }, [])

  // Check for saved document payment journey on component mount
  useEffect(() => {
    const journey = loadDocumentPaymentJourney()
    if (journey) {
      // Journey loaded, but we don't need to show persistence UI anymore
    }
  }, [])

  // Refresh documents when the page becomes visible (e.g., after returning from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchDocuments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setFormData({})
    setGeneratedDocument(null)
  }

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const validateForm = () => {
    if (!selectedTemplate) return false
    
    for (const field of selectedTemplate.fields) {
      if (field.required && !formData[field.name]) {
        return false
      }
    }
    return true
  }

  const handleGenerateDocument = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setGenerating(true)

    try {
      const response = await fetch(API_ENDPOINTS.DOCUMENTS.GENERATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate?.id,
          formData,
          userId: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate document')
      }

      const data = await response.json()
      
      // Store the document content with a slight delay to prevent easy access
      setTimeout(() => {
        setGeneratedDocument(data.document)
      }, 100)
      
      toast({
        title: 'Document Generated',
        description: 'Your document has been generated successfully. Complete payment to download.',
        variant: 'default'
      })
    } catch (err) {
      console.error('Error generating document:', err)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate document. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedDocument) return
    
    // Show payment modal for generated document
    setShowGeneratedDocumentPaymentModal(true)
  }

  const handleCopy = async () => {
    if (!generatedDocument) return
    
    // Show payment modal for generated document
    setShowGeneratedDocumentPaymentModal(true)
  }

  // Payment-related functions
  const handlePaymentRequired = (doc: DocumentRecord) => {
    setSelectedDocumentForPayment(doc)
    setShowPaymentModal(true)
  }

  const createPaymentSession = async (doc: DocumentRecord) => {
    if (!user?.id) return
    
    // Save payment journey before proceeding
    const journeyData = {
      documentId: doc.id,
      document: doc,
      type: 'existing_document' as const,
      templateName: doc.template_name,
      documentFee: doc.document_fee,
      formData: doc.form_data
    }
    saveDocumentPaymentJourney(journeyData)
    
    setPaymentLoading(doc.id)
    try {
      const response = await fetch(API_ENDPOINTS.DOCUMENTS.CREATE_PAYMENT(doc.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment session')
      }

      const data = await response.json()
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating payment session:', error)
      toast({
        title: 'Payment Error',
        description: 'Failed to create payment session. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setPaymentLoading(null)
    }
  }

  const createGeneratedDocumentPaymentSession = async () => {
    if (!user?.id || !selectedTemplate) return
    
    // Save payment journey before proceeding
    const journeyData = {
      documentId: 'temp',
      template: selectedTemplate,
      formData: formData,
      generatedDocument: generatedDocument || undefined,
      type: 'generated_document' as const,
      templateName: selectedTemplate.name,
      documentFee: selectedTemplate.fields.length * 5 // Estimate fee based on complexity
    }
    saveDocumentPaymentJourney(journeyData)
    
    setPaymentLoading('generated')
    try {
      // Create a temporary document record for payment
      const response = await fetch(API_ENDPOINTS.DOCUMENTS.CREATE_PAYMENT('temp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          templateId: selectedTemplate.id,
          formData: formData,
          generatedDocument: generatedDocument
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment session')
      }

      const data = await response.json()
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating payment session:', error)
      toast({
        title: 'Payment Error',
        description: 'Failed to create payment session. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setPaymentLoading(null)
    }
  }

  const handleGeneratedDocumentPaymentSuccess = async (sessionId: string) => {
    if (!user?.id || !selectedTemplate) return
    
    setPaymentLoading('verifying')
    try {
      // Create the actual document record after successful payment
      const response = await fetch(API_ENDPOINTS.DOCUMENTS.GENERATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          templateId: selectedTemplate.id,
          formData: formData,
          paymentSessionId: sessionId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create document after payment')
      }

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Payment Successful',
          description: 'Your document has been created and is ready for download.',
          variant: 'default'
        })
        
        // Clear the generated document preview and refresh documents
        setGeneratedDocument(null)
        setSelectedTemplate(null)
        setFormData({})
        await fetchDocuments()
        
        // Clear URL parameters
        window.history.replaceState({}, '', '/dashboard/documents')
      }
    } catch (error) {
      console.error('Error creating document after payment:', error)
      toast({
        title: 'Error',
        description: 'Payment was successful but there was an error creating your document. Please contact support.',
        variant: 'destructive'
      })
    } finally {
      setPaymentLoading(null)
    }
  }



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
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  const filteredTemplates = documentTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredDocuments = userDocuments.filter(doc => 
    doc.template_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'archived': return <Clock4 className="h-4 w-4 text-yellow-500" />
      case 'deleted': return <Trash2 className="h-4 w-4 text-red-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getTemplateIcon = (templateId: string) => {
    const template = documentTemplates.find(t => t.id === templateId)
    return template?.icon || '📄'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your documents...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout currentPage="/dashboard/documents">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Saved Document Payment Notification */}
          {savedDocumentPayment && (
            <div className="mb-6">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Saved Payment</h3>
                        <p className="text-sm text-blue-700">
                          {savedDocumentPayment.type === 'existing_document' 
                            ? `You have a saved payment for ${savedDocumentPayment.document?.template_name || 'a document'}`
                            : `You have a saved payment for ${savedDocumentPayment.template?.name || 'a generated document'}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => continueDocumentPaymentJourney(savedDocumentPayment)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Continue Payment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearDocumentPaymentJourney}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Tabs defaultValue="templates" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2 bg-white/80 backdrop-blur-sm border">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Documents
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Documents
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-8">
              {!selectedTemplate ? (
                <>
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 max-w-md">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search templates..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-gray-200">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Employment">Employment</SelectItem>
                          <SelectItem value="Real Estate">Real Estate</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-1">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className={`h-8 w-8 p-0 transition-all duration-200 ${
                            viewMode === 'grid' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className={`h-8 w-8 p-0 transition-all duration-200 ${
                            viewMode === 'list' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Templates Grid */}
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "space-y-4"
                  }>
                    {filteredTemplates.map((template) => (
                      <Card 
                        key={template.id}
                        className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 bg-white/80 backdrop-blur-sm ${
                          viewMode === 'list' ? 'flex items-center p-6' : ''
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className={viewMode === 'list' ? 'flex-1 p-0' : ''}>
                          <div className={`flex items-center gap-4 ${viewMode === 'list' ? 'flex-row' : 'flex-col text-center'}`}>
                            <div className={`p-4 rounded-2xl bg-gradient-to-r ${template.gradient} text-white text-3xl ${viewMode === 'list' ? 'flex-shrink-0' : ''}`}>
                              {template.icon}
                            </div>
                            <div className={viewMode === 'list' ? 'flex-1' : ''}>
                              <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {template.name}
                              </CardTitle>
                              <CardDescription className="mt-2 text-gray-600">
                                {template.description}
                              </CardDescription>
                              <div className="flex items-center gap-2 mt-3">
                                <Badge variant="secondary" className="text-xs">
                                  {template.category}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {template.fields.length} fields
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        {viewMode === 'list' && (
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                /* Document Form */
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedTemplate(null)
                        setFormData({})
                        setGeneratedDocument(null)
                      }}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      Back to Templates
                    </Button>
                  </div>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader className="text-center pb-8">
                      <div className="flex items-center justify-center mb-4">
                        <div className={`p-4 rounded-2xl bg-gradient-to-r ${selectedTemplate.gradient} text-white text-4xl`}>
                          {selectedTemplate.icon}
                        </div>
                      </div>
                      <CardTitle className="text-3xl font-bold text-gray-900">
                        {selectedTemplate.name}
                      </CardTitle>
                      <CardDescription className="text-lg text-gray-600 mt-2">
                        {selectedTemplate.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedTemplate.fields.map((field) => (
                          <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            
                            {field.type === 'textarea' ? (
                              <Textarea
                                id={field.name}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                                rows={3}
                                className="bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500"
                              />
                            ) : field.type === 'select' ? (
                              <Select value={formData[field.name] || ''} onValueChange={(value) => handleInputChange(field.name, value)}>
                                <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500">
                                  <SelectValue placeholder={field.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={field.name}
                                type={field.type}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                                className="bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center pt-6">
                        <Button
                          onClick={handleGenerateDocument}
                          disabled={!validateForm() || generating}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {generating ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Generating Document...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5 mr-2" />
                              Generate Document
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generated Document Display */}
                  {generatedDocument && (
                    <Card className="mt-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          Document Generated Successfully
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto document-secure relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-red-400/20 pointer-events-none z-10"></div>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg transform rotate-12">
                              PAYMENT REQUIRED
                            </div>
                          </div>
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono relative z-0">
                            {generatedDocument ? generatedDocument.split('').map((char, index) => (
                              <span key={index} style={{ opacity: 0.7 }}>{char}</span>
                            )) : ''}
                          </pre>
                        </div>
                        <div className="flex gap-3 mt-6">
                          <Button 
                            onClick={handleDownload} 
                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700"
                          >
                            <Lock className="h-4 w-4" />
                            Pay to Download
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleCopy} 
                            className="flex items-center gap-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                          >
                            <Lock className="h-4 w-4" />
                            Pay to Copy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {/* Search */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchDocuments}
                    disabled={docsLoading}
                    className="bg-white/80 backdrop-blur-sm border-gray-200"
                  >
                    {docsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </>
                    )}
                  </Button>
                  <div className="flex bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-8 w-8 p-0 transition-all duration-200 ${
                        viewMode === 'grid' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-8 w-8 p-0 transition-all duration-200 ${
                        viewMode === 'list' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Documents Display */}
              {docsLoading ? (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="bg-white/80 backdrop-blur-sm border-0">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-6 w-1/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
                      <p className="text-gray-600">Generate your first document to get started</p>
                    </div>
                    <Button onClick={() => setSelectedTemplate(null)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Document
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="bg-white/80 backdrop-blur-sm border-0 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-xl">
                              {getTemplateIcon(doc.template_id)}
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {doc.template_name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(doc.status)}
                                {getPaymentStatusBadge(doc.payment_status)}
                                <span className="text-sm text-gray-500">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Created {new Date(doc.created_at).toLocaleString()}</span>
                            {doc.payment_status !== 'paid' && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                                <Lock className="h-3 w-3 mr-1" />
                                Payment Required
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="h-4 w-4" />
                              <span>Fee: ${(doc.document_fee / 100).toFixed(2)}</span>
                            </div>
                            {doc.payment_status === 'paid' && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Download className="h-3 w-3" />
                                <span>{doc.download_count} downloads</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                if (doc.payment_status === 'paid') {
                                  router.push(`/dashboard/documents/${doc.id}`)
                                } else {
                                  handlePaymentRequired(doc)
                                }
                              }}
                              className="flex-1"
                              disabled={doc.payment_status !== 'paid'}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {doc.payment_status === 'paid' ? 'View' : 'Pay to View'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant={doc.payment_status === 'paid' ? 'default' : 'default'}
                              onClick={() => doc.payment_status === 'paid' ? router.push(`/dashboard/documents/${doc.id}`) : handlePaymentRequired(doc)}
                              disabled={paymentLoading === doc.id}
                              className={doc.payment_status === 'paid' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                            >
                              {doc.payment_status === 'paid' ? (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Download</span>
                                </>
                              ) : (
                                <>
                                
                                  <Lock className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Pay ${(doc.document_fee / 100).toFixed(2)}</span>
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={async () => { 
                                if (doc.payment_status === 'paid') {
                                  await navigator.clipboard.writeText(doc.generated_document)
                                  toast({
                                    title: 'Copied!',
                                    description: 'Document copied to clipboard',
                                    variant: 'success'
                                  })
                                } else {
                                  handlePaymentRequired(doc)
                                }
                              }}
                              disabled={doc.payment_status !== 'paid'}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDocumentForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Payment Required</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPaymentModal(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Complete payment to download your legal document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-xl">
                    {getTemplateIcon(selectedDocumentForPayment.template_id)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedDocumentForPayment.template_name}</h3>
                    <p className="text-sm text-gray-600">
                      Created {new Date(selectedDocumentForPayment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Document Fee:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${(selectedDocumentForPayment.document_fee / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Secure payment processing via Stripe</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Instant download after payment</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Unlimited downloads once paid</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Save current payment state
                      const journeyData = {
                        documentId: selectedDocumentForPayment.id,
                        document: selectedDocumentForPayment,
                        type: 'existing_document'
                      }
                      saveDocumentPaymentJourney(journeyData)
                      setShowPaymentModal(false)
                      toast({
                        title: "Payment Saved",
                        description: "Your payment details have been saved. You can continue later from the dashboard.",
                      })
                    }}
                  >
                    Continue Later
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => createPaymentSession(selectedDocumentForPayment)}
                  disabled={paymentLoading === selectedDocumentForPayment.id}
                >
                  {paymentLoading === selectedDocumentForPayment.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${(selectedDocumentForPayment.document_fee / 100).toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generated Document Payment Modal */}
      {showGeneratedDocumentPaymentModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Payment Required</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowGeneratedDocumentPaymentModal(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Complete payment to download your generated document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-xl">
                    {getTemplateIcon(selectedTemplate.id)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-600">
                      Generated just now
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Document Fee:</span>
                  <span className="text-2xl font-bold text-green-600">
                    $9.99
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Secure payment processing via Stripe</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Instant download after payment</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Unlimited downloads once paid</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Save current payment state
                      const journeyData = {
                        documentId: 'temp',
                        template: selectedTemplate,
                        formData: formData,
                        generatedDocument: generatedDocument,
                        type: 'generated_document'
                      }
                      saveDocumentPaymentJourney(journeyData)
                      setShowGeneratedDocumentPaymentModal(false)
                      toast({
                        title: "Payment Saved",
                        description: "Your payment details have been saved. You can continue later from the dashboard.",
                      })
                    }}
                  >
                    Continue Later
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowGeneratedDocumentPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={createGeneratedDocumentPaymentSession}
                  disabled={paymentLoading === 'generated'}
                >
                  {paymentLoading === 'generated' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay $9.99
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  )
} 