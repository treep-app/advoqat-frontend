'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Scale, 
  FileText, 
  ArrowLeft,
  Download,
  Copy,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf';
import { User } from '@supabase/supabase-js';

interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  fields: DocumentField[]
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
  userId: string;
  templateId: string;
  formData: Record<string, string>;
  document: string;
  createdAt: string;
}

const documentTemplates: DocumentTemplate[] = [
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    description: 'Protect confidential information with a legally binding NDA',
    category: 'Business',
    icon: '📄',
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [userDocuments, setUserDocuments] = useState<DocumentRecord[]>([])
  const [docsLoading, setDocsLoading] = useState(false)

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

  useEffect(() => {
    if (user) {
      setDocsLoading(true)
      fetch(`/api/v1/documents/user?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setUserDocuments((data.documents || []) as DocumentRecord[])
        })
        .catch(err => {
          console.error('Failed to fetch user documents', err)
        })
        .finally(() => setDocsLoading(false))
    }
  }, [user])

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setFormData({})
    setGeneratedDocument(null)
    setMessage(null)
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
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setGenerating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/v1/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
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
      setGeneratedDocument(data.document)
      setMessage({ type: 'success', text: 'Document generated successfully!' })
    } catch (err) {
      console.error('Error generating document:', err)
      setMessage({ type: 'error', text: 'Failed to generate document. Please try again.' })
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedDocument) return
    
    const blob = new Blob([generatedDocument], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate?.name || 'document'}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleCopy = async () => {
    if (!generatedDocument) return
    
    try {
      await navigator.clipboard.writeText(generatedDocument)
      setMessage({ type: 'success', text: 'Document copied to clipboard!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to copy document' })
    }
  }

  const handleDownloadPDF = (doc: DocumentRecord) => {
    const pdf = new jsPDF()
    pdf.setFont('courier', 'normal')
    pdf.setFontSize(12)
    pdf.text(doc.document, 10, 20)
    pdf.save(`${doc.templateId || 'document'}-${doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0,10) : ''}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Scale className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LegaliQ</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-700">Document Generator</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Documents Section */}
        {user && !loading && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center"><FileText className="h-5 w-5 mr-2" />Your Generated Documents</h2>
            {docsLoading ? (
              <div className="text-gray-500">Loading documents...</div>
            ) : userDocuments.length === 0 ? (
              <div className="text-gray-400">No documents generated yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-left">
                      <th className="py-2 px-4">Type</th>
                      <th className="py-2 px-4">Created</th>
                      <th className="py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDocuments.map((doc: DocumentRecord) => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 font-medium">{doc.templateId.replace(/-/g, ' ')}</td>
                        <td className="py-2 px-4">{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : ''}</td>
                        <td className="py-2 px-4 space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setGeneratedDocument(doc.document)}>
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(doc)}>
                            <Download className="h-4 w-4 mr-1" /> PDF
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(doc.document); setMessage({ type: 'success', text: 'Copied to clipboard!' }) }}>
                            <Copy className="h-4 w-4 mr-1" /> Copy
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Generator</h1>
          <p className="text-gray-600">
            Generate professional legal documents tailored to your needs
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {!selectedTemplate ? (
          // Template Selection
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentTemplates.map((template) => (
              <Card 
                key={template.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{template.icon}</div>
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{template.category}</span>
                    <span>{template.fields.length} fields</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Document Form
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedTemplate(null)
                  setFormData({})
                  setGeneratedDocument(null)
                  setMessage(null)
                }}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Templates</span>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{selectedTemplate.icon}</div>
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
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
                        />
                      ) : field.type === 'select' ? (
                        <Select
                          value={formData[field.name] || ''}
                          onValueChange={(value) => handleInputChange(field.name, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'date' ? (
                        <Input
                          id={field.name}
                          type="date"
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          required={field.required}
                        />
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleGenerateDocument}
                    disabled={generating || !validateForm()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Document
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated Document */}
            {generatedDocument && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generated Document</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {generatedDocument}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
} 