'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToastContext } from '@/components/ui/toast-context'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Loader2,
  Trash2
} from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'

interface UploadedDocument {
  id: string
  originalName: string
  fileName: string
  extractedText: string
}

interface DocumentUploadProps {
  sessionId?: string
  userId: string
  onDocumentsUploaded?: (documents: UploadedDocument[]) => void
  onDocumentsChanged?: () => void
}

export function DocumentUpload({ sessionId, userId, onDocumentsUploaded, onDocumentsChanged }: DocumentUploadProps) {
  const { toast } = useToastContext()
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
      const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)
    })

    if (validFiles.length === 0) {
      toast({
        title: 'Invalid Files',
        description: 'Please select PDF, DOCX, DOC, or TXT files only.',
        variant: 'destructive'
      })
      return
    }

    if (validFiles.length > 5) {
      toast({
        title: 'Too Many Files',
        description: 'You can upload a maximum of 5 files at once.',
        variant: 'destructive'
      })
      return
    }

    uploadFiles(validFiles)
  }

  // Upload files to the server
  const uploadFiles = async (files: File[]) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('userId', userId)
      if (sessionId) {
        formData.append('sessionId', sessionId)
      }

      files.forEach(file => {
        formData.append('documents', file)
      })

      const response = await fetch(API_ENDPOINTS.AI_ASSISTANT.UPLOAD_DOCUMENTS, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      
      if (data.success) {
        setUploadedFiles(prev => [...prev, ...data.documents])
        onDocumentsUploaded?.(data.documents)
        onDocumentsChanged?.()
        
        toast({
          title: 'Upload Successful',
          description: data.message,
          variant: 'success'
        })
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload documents. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  // Delete a document
  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.AI_ASSISTANT.DELETE_DOCUMENT(documentId)}?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(doc => doc.id !== documentId))
        onDocumentsChanged?.()
        
        toast({
          title: 'Document Deleted',
          description: 'Document removed successfully',
          variant: 'success'
        })
      } else {
        throw new Error('Failed to delete document')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive'
      })
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}>
        <CardContent className="p-6">
          <div
            className="flex flex-col items-center justify-center space-y-4 py-8"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className={`h-12 w-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Documents for AI Analysis
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supported formats: PDF, DOCX, DOC, TXT (Max 10MB each, up to 5 files)
                <br />
                <span className="text-orange-500">Note: PDFs are stored but may require conversion for full text extraction</span>
              </p>
            </div>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-4"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </>
              )}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recently Uploaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">{file.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {file.extractedText.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocument(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  )
} 