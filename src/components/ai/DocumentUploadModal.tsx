'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToastContext } from '@/components/ui/toast-context'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  File,
  MessageSquare,
  Trash2
} from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'

interface UploadedDocument {
  id: string
  originalName: string
  fileName: string
  extractedText: string
}

interface SessionDocument {
  id: string
  original_name?: string
  originalName?: string
  extracted_text?: string
  extractedText?: string
  created_at?: string
  createdAt?: string
}

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId?: string
  userId: string
  onDocumentsUploaded?: (documents: UploadedDocument[]) => void
  onDocumentsChanged?: () => void
  onStartDocumentChat?: (documents: SessionDocument[]) => void
}

export function DocumentUploadModal({ 
  isOpen, 
  onClose, 
  sessionId, 
  userId, 
  onDocumentsUploaded, 
  onDocumentsChanged,
  onStartDocumentChat
}: DocumentUploadModalProps) {
  const { toast } = useToastContext()
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([])
  const [sessionDocuments, setSessionDocuments] = useState<SessionDocument[]>([])
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
          description: `${data.message} Taking you to document chat...`,
          variant: 'success'
        })

        // Auto-start document chat after successful upload
        setTimeout(() => {
          onStartDocumentChat?.(data.documents)
        }, 1000) // Small delay to show success message
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
        setSessionDocuments(prev => prev.filter(doc => doc.id !== documentId))
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

  // Get file icon based on type
  const getFileIcon = (fileName: string) => {
    if (!fileName) return <FileText className="h-5 w-5 text-gray-400" />
    
    const extension = fileName.toLowerCase().split('.').pop() || ''
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'docx':
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-500" />
      default:
        return <File className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Upload Documents for AI Analysis
          </DialogTitle>
          <DialogDescription>
            Upload legal documents to help the AI provide more accurate and contextual responses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div className={`border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-gray-400'
          }`}>
            <div
              className="flex flex-col items-center justify-center space-y-4"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={`p-4 rounded-full transition-colors ${
                isDragOver ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Upload className={`h-8 w-8 ${isDragOver ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
                </h3>
                <p className="text-sm text-gray-500">
                  or click to browse your files
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="text-xs">PDF</Badge>
                <Badge variant="outline" className="text-xs">DOCX</Badge>
                <Badge variant="outline" className="text-xs">DOC</Badge>
                <Badge variant="outline" className="text-xs">TXT</Badge>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Max 10MB per file • Up to 5 files
              </p>
              <p className="text-xs text-blue-600 text-center font-medium">
                ✨ You&apos;ll be taken to document chat after upload
              </p>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Recently Uploaded
              </h4>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.originalName)}
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{file.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {file.extractedText.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDocument(file.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

                     {/* Session Documents */}
           {sessionDocuments.length > 0 && (
             <div className="space-y-3">
               <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                 <FileText className="h-4 w-4 text-blue-500" />
                 Available Documents
               </h4>
               <div className="space-y-2">
                 {sessionDocuments.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                       <div className="flex items-center gap-3">
                         {getFileIcon(doc.original_name || doc.originalName || 'unknown')}
                         <div className="flex-1">
                           <p className="font-medium text-sm text-gray-900">{doc.original_name || doc.originalName || 'Unknown Document'}</p>
                           <p className="text-xs text-gray-500">
                             Available for AI analysis
                           </p>
                         </div>
                       </div>
                     <Badge variant="secondary" className="text-xs">
                       Ready
                     </Badge>
                   </div>
                 ))}
               </div>
               
               {/* Chat with Documents Button */}
               <div className="pt-4 border-t border-gray-200">
                 <Button
                   onClick={() => onStartDocumentChat?.(sessionDocuments)}
                   className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                 >
                   <MessageSquare className="h-4 w-4 mr-2" />
                   Chat with Documents
                 </Button>
                 <p className="text-xs text-gray-500 mt-2 text-center">
                   Start a conversation about your uploaded documents
                 </p>
               </div>
             </div>
           )}

          {/* Info Section */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              How it works
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload your legal documents (contracts, agreements, etc.)</li>
              <li>• The AI will reference these documents in conversations</li>
              <li>• Ask questions about your documents for instant analysis</li>
              <li>• Documents are securely stored and private to your session</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 