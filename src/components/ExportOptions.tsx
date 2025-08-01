'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Download, 
  FileText, 
  FileType, 
  FileImage,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useToastContext } from '@/components/ui/toast-context'
import { API_ENDPOINTS } from '@/lib/config'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { 
  formatForPDF, 
  formatForDOCX, 
  formatForTXT, 
  extractTitle 
} from '@/lib/documentFormatter'

interface ExportOptionsProps {
  document: DocumentRecord
  documentId: string
  userId: string
  onDownloadComplete?: () => void
}

interface DocumentRecord {
  id: string
  template_name: string
  generated_document: string
  created_at: string
  document_type: string
  payment_status: string
}

interface FormatOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  extension: string
}

const formatOptions: FormatOption[] = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Print-ready, read-only format',
    icon: <FileImage className="h-5 w-5" />,
    color: 'bg-red-500',
    extension: 'pdf'
  },
  {
    id: 'docx',
    name: 'Word Document',
    description: 'Editable in Microsoft Word',
    icon: <FileType className="h-5 w-5" />,
    color: 'bg-blue-500',
    extension: 'docx'
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Simple text format',
    icon: <FileText className="h-5 w-5" />,
    color: 'bg-gray-500',
    extension: 'txt'
  }
]

export function ExportOptions({ document, documentId, userId, onDownloadComplete }: ExportOptionsProps) {
  const { toast } = useToastContext()
  const [downloading, setDownloading] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)

  const generateFileName = (format: string) => {
    const title = extractTitle(document.generated_document || '')
    const cleanTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
    const date = document.created_at ? new Date(document.created_at).toISOString().slice(0, 10) : ''
    return `${cleanTitle}-${date}.${format}`
  }

  const createPDF = (content: string, fileName: string) => {
    const pdf = new jsPDF()
    
    // Set Times New Roman font (using Helvetica as fallback since Times New Roman isn't available in jsPDF)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(12)
    
    // Format content for PDF
    const formattedContent = formatForPDF(content)
    const title = extractTitle(content)
    
    // Add title with better formatting
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, 20, 30)
    
    // Add a line under the title
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, 35, 190, 35)
    
    // Add content with better spacing
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    const paragraphs = formattedContent.split('\n\n')
    let yPosition = 50
    
    paragraphs.forEach((paragraph: string) => {
      if (yPosition > 280) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Split long paragraphs into lines that fit the page width
      const lines = pdf.splitTextToSize(paragraph, 170)
      
      lines.forEach((line: string) => {
        if (yPosition > 280) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(line, 20, yPosition)
        yPosition += 7
      })
      
      // Add space between paragraphs
      yPosition += 8
    })
    
    pdf.save(fileName)
  }

  const createDOCX = async (content: string, fileName: string) => {
    // Format content for DOCX
    const paragraphs = formatForDOCX(content)
    const title = extractTitle(content)
    
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: [
          // Title
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400,
              before: 200
            }
          }),
          // Content paragraphs
          ...paragraphs.map(paragraph => 
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraph,
                  size: 24, // 12pt
                  font: 'Times New Roman'
                })
              ],
              spacing: {
                after: 240, // 12pt spacing
                before: 0
              },
              alignment: AlignmentType.JUSTIFIED,
              indent: {
                firstLine: 480 // 0.5 inch indent
              }
            })
          )
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    })
    saveAs(blob, fileName)
  }

  const createTXT = (content: string, fileName: string) => {
    const formattedContent = formatForTXT(content)
    const blob = new Blob([formattedContent], { type: 'text/plain' })
    saveAs(blob, fileName)
  }

  const handleDownload = async (format: string) => {
    if (!document || document.payment_status !== 'paid') {
      toast({
        title: 'Payment Required',
        description: 'Please complete payment before downloading this document.',
        variant: 'destructive'
      })
      return
    }

    setDownloading(format)
    try {
      // Get document content from backend
      const response = await fetch(`${API_ENDPOINTS.DOCUMENTS.DOWNLOAD(documentId)}?userId=${userId}&format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Payment Required',
            description: 'Please complete payment before downloading this document.',
            variant: 'destructive'
          })
          return
        }
        throw new Error('Failed to download document')
      }

      const data = await response.json()
      const fileName = generateFileName(format)
      
      // Create file based on format
      switch (format) {
        case 'pdf':
          createPDF(data.document.content, fileName)
          break
        case 'docx':
          await createDOCX(data.document.content, fileName)
          break
        case 'txt':
          createTXT(data.document.content, fileName)
          break
        default:
          throw new Error('Unsupported format')
      }
      
      toast({
        title: 'Download Complete',
        description: `Document downloaded as ${format.toUpperCase()} successfully (Download #${data.document.downloadCount})`,
        variant: 'default'
      })
      
      onDownloadComplete?.()
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({
        title: 'Download Failed',
        description: `Failed to download document as ${format.toUpperCase()}. Please try again.`,
        variant: 'destructive'
      })
    } finally {
      setDownloading(null)
    }
  }

  if (document.payment_status !== 'paid') {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Payment Required</p>
              <p className="text-sm text-yellow-700">Complete payment to download this document.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {!showOptions ? (
        <Button 
          onClick={() => setShowOptions(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Document
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Choose Download Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {formatOptions.map((format) => (
                <div
                  key={format.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-white ${format.color}`}>
                      {format.icon}
                    </div>
                    <div>
                      <p className="font-medium">{format.name}</p>
                      <p className="text-sm text-gray-600">{format.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(format.id)}
                    disabled={downloading === format.id}
                    size="sm"
                    variant="outline"
                  >
                    {downloading === format.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setShowOptions(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 