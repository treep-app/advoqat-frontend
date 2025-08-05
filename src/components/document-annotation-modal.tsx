'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Save, 
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'

interface DocumentAnnotationModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: number
  caseTitle: string
  onAnnotationComplete: () => void
}

export default function DocumentAnnotationModal({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  onAnnotationComplete
}: DocumentAnnotationModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [annotationNotes, setAnnotationNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!uploadedFile) {
      setError('Please upload a document first')
      return
    }

    if (!annotationNotes.trim()) {
      setError('Please add annotation notes')
      return
    }

    try {
      setLoading(true)
      setError('')

      // In a real implementation, you would:
      // 1. Upload the file to cloud storage (AWS S3, etc.)
      // 2. Get the URL of the uploaded file
      // 3. Send the annotation data to the backend

      // For now, we'll simulate the upload
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('notes', annotationNotes)
      formData.append('caseId', caseId.toString())

      // Simulate file upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Send annotation data to backend
      const response = await fetch(API_ENDPOINTS.FREELANCERS.ANNOTATE_CASE(caseId.toString()), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annotatedDocumentUrl: 'https://example.com/uploaded-document.pdf', // This would be the actual uploaded file URL
          notes: annotationNotes
        })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onAnnotationComplete()
          onClose()
          setSuccess(false)
          setUploadedFile(null)
          setAnnotationNotes('')
        }, 1500)
      } else {
        setError('Failed to save annotation')
      }
    } catch (error) {
      console.error('Error saving annotation:', error)
      setError('Failed to save annotation')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setUploadedFile(null)
      setAnnotationNotes('')
      setError('')
      setSuccess(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Annotation - {caseTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700">Annotation saved successfully!</span>
            </div>
          )}

          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Annotated Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="document-upload">Select Document</Label>
                <Input
                  id="document-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
                </p>
              </div>

              {uploadedFile && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{uploadedFile.name}</span>
                  <span className="text-sm text-gray-500">
                    ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Annotation Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Annotation Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="annotation-notes">Legal Analysis & Recommendations</Label>
                  <Textarea
                    id="annotation-notes"
                    placeholder="Provide detailed legal analysis, recommendations, and any important notes for the client..."
                    value={annotationNotes}
                    onChange={(e) => setAnnotationNotes(e.target.value)}
                    className="mt-1 min-h-[200px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="key-issues">Key Legal Issues</Label>
                    <Textarea
                      id="key-issues"
                      placeholder="List the main legal issues identified..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="recommendations">Recommendations</Label>
                    <Textarea
                      id="recommendations"
                      placeholder="Provide specific recommendations for the client..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="next-steps">Next Steps</Label>
                  <Textarea
                    id="next-steps"
                    placeholder="Outline the recommended next steps for the client..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          {uploadedFile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Document Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{uploadedFile.name}</h3>
                  <p className="text-gray-600 mb-4">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex items-center gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !uploadedFile || !annotationNotes.trim()}>
            <Save className="h-4 w-4 mr-1" />
            {loading ? 'Saving...' : 'Save Annotation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 