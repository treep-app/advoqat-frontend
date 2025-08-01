'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToastContext } from '@/components/ui/toast-context'
import { 
  Send, 
  Bot, 
  User,
  Loader2,
  FileText,
  Copy,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'

interface Document {
  id: string
  original_name?: string
  originalName?: string
  extracted_text?: string
  extractedText?: string
  created_at?: string
  createdAt?: string
}

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
  tokens_used?: number
  model_used?: string
}

interface DocumentChatProps {
  documents: Document[]
  sessionId?: string
  userId: string
  onClose: () => void
}

export function DocumentChat({ documents, sessionId, userId, onClose }: DocumentChatProps) {
  const { toast } = useToastContext()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDocumentPreview, setShowDocumentPreview] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-select first document if available
  useEffect(() => {
    if (documents.length > 0 && !selectedDocument) {
      setSelectedDocument(documents[0])
    }
  }, [documents, selectedDocument])

  const sendMessage = async () => {
    if (!message.trim() || !selectedDocument || sending) return

    setSending(true)
    const userMessage = message
    setMessage('')

    // Add user message to UI immediately
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await fetch(API_ENDPOINTS.AI_ASSISTANT.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          message: `Document: ${getDocumentName(selectedDocument)}\n\nDocument Content:\n${getDocumentText(selectedDocument) ? getDocumentText(selectedDocument).substring(0, 2000) : 'No content available'}...\n\nUser Question: ${userMessage}`,
          userId: userId,
          hasDocuments: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Add AI response to UI
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        tokens_used: data.tokensUsed,
        model_used: data.modelUsed
      }
      setMessages(prev => [...prev, aiMessage])

      toast({
        title: 'Message Sent',
        description: 'AI response received successfully',
        variant: 'success'
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard',
      variant: 'success'
    })
  }

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
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }

  const getTextLength = (text: string | null | undefined) => {
    if (!text) return 0
    return text.length
  }

  const getDocumentName = (doc: Document) => {
    return doc.original_name || doc.originalName || 'Unknown file'
  }

  const getDocumentText = (doc: Document) => {
    return doc.extracted_text || doc.extractedText || ''
  }

  const getDocumentDate = (doc: Document) => {
    return doc.created_at || doc.createdAt
  }

  return (
    <div className="flex h-full">
      {/* Document Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Your Documents
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Select a document to chat with
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedDocument?.id === doc.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedDocument(doc)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {getFileIcon(getDocumentName(doc))}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {getDocumentName(doc)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(getDocumentDate(doc))}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getTextLength(getDocumentText(doc))} characters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedDocument && (
                <>
                                    {getFileIcon(getDocumentName(selectedDocument))}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getDocumentName(selectedDocument)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Chat with this document
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentPreview(!showDocumentPreview)}
                className="text-gray-600"
              >
                {showDocumentPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDocumentPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-gray-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
                    <MessageSquare className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Chat with {selectedDocument ? getDocumentName(selectedDocument) : 'Document'}
                  </h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    Ask questions about this document and get instant analysis, summaries, and insights.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                      &quot;Summarize this document&quot;
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                      &quot;What are the key terms?&quot;
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                      &quot;Explain section 3&quot;
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                      &quot;Find all dates mentioned&quot;
                    </Badge>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <div className={`p-3 rounded-full ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600'
                      }`}>
                        {msg.role === 'user' ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </div>
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-gray-50 text-gray-900 border border-gray-100'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-4">
                              {msg.tokens_used && (
                                <span className="text-xs text-gray-500">
                                  Tokens: {msg.tokens_used}
                                </span>
                              )}
                              {msg.model_used && (
                                <span className="text-xs text-gray-500">
                                  Model: {msg.model_used}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyMessage(msg.content)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {sending && (
                <div className="flex gap-4 justify-start">
                  <div className="p-3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600">Analyzing document...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <div className="flex gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about this document..."
                  className="flex-1 bg-white border-gray-200 focus:border-blue-500 rounded-xl shadow-sm"
                  disabled={sending || !selectedDocument}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!message.trim() || sending || !selectedDocument}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 rounded-xl shadow-sm"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Document Preview */}
          {showDocumentPreview && selectedDocument && (
            <div className="w-96 border-l border-gray-200 bg-gray-50">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Document Preview</h4>
                <p className="text-sm text-gray-500">Content from {getDocumentName(selectedDocument)}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {getDocumentText(selectedDocument) ? getDocumentText(selectedDocument).substring(0, 2000) : 'No content available'}
                      {getDocumentText(selectedDocument) && getDocumentText(selectedDocument).length > 2000 && '...'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 