'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Paperclip, User, MessageSquare, FileText, AlertCircle } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  id: string
  content: string
  sender: 'client' | 'lawyer'
  timestamp: string
  attachments?: string[]
}

interface Case {
  id: number
  title: string
  status: string
  client_name?: string
  freelancer_name?: string
  freelancer_email?: string
}

export default function ClientChatPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const caseId = params.id as string
  
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchCaseAndMessages = async () => {
      try {
        // Fetch case details
        const caseResponse = await fetch(API_ENDPOINTS.CASES.CASE(caseId))
        if (!caseResponse.ok) {
          throw new Error('Failed to fetch case details')
        }
        const caseData = await caseResponse.json()
        setCaseData(caseData)
        
        // For now, use mock messages - in real app, fetch from API
        const mockMessages: Message[] = [
          {
            id: '1',
            content: 'Hello! I\'ve reviewed your case and I\'m ready to help you with this legal matter.',
            sender: 'lawyer',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            content: 'Thank you for taking my case. I have some additional documents I\'d like to share.',
            sender: 'client',
            timestamp: new Date(Date.now() - 1800000).toISOString()
          },
          {
            id: '3',
            content: 'Please go ahead and share the documents. I\'ll review them and get back to you with my analysis.',
            sender: 'lawyer',
            timestamp: new Date(Date.now() - 900000).toISOString()
          }
        ]
        setMessages(mockMessages)
      } catch (error) {
        console.error('Error fetching case and messages:', error)
        toast({
          title: "Error",
          description: "Failed to load chat",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (caseId) {
      fetchCaseAndMessages()
    }
  }, [caseId, toast])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    
    setSending(true)
    try {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender: 'client',
        timestamp: new Date().toISOString()
      }
      
      // Add message to state immediately for optimistic UI
      setMessages(prev => [...prev, message])
      setNewMessage('')
      
      // In real app, send to API
      // await fetch('/api/chat/messages', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ caseId, content: newMessage })
      // })
      
      // Simulate lawyer response after 2 seconds
      setTimeout(() => {
        const lawyerResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Thank you for your message. I\'ll review this and get back to you shortly.',
          sender: 'lawyer',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, lawyerResponse])
      }, 2000)
      
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In real app, upload file and send message with attachment
      toast({
        title: "File Upload",
        description: `File "${file.name}" uploaded successfully`,
        variant: "default",
      })
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading chat...</p>
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
          <p className="text-gray-600 mb-4">The case you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.push('/dashboard/cases')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/cases/${caseId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Case
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{caseData.title}</h1>
              <Badge variant="outline">{caseData.status}</Badge>
            </div>
            <p className="text-sm text-gray-600">
              {caseData.freelancer_name ? `Chatting with ${caseData.freelancer_name}` : 'Waiting for lawyer assignment'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/cases/${caseId}`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Case Details
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                message.sender === 'client'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  {message.sender === 'client' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'client' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFileUpload}
            disabled={sending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
      </div>
    </div>
  )
} 