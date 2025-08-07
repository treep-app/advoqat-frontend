'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Send, 
  User, 
  MessageCircle, 
  FileText,
  Download,
  Upload
} from 'lucide-react'
import FreelancerLayout from '@/components/layout/freelancer-layout'
import { API_ENDPOINTS } from '@/lib/config'
import { useToastContext } from '@/components/ui/toast-context'

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
  client_email?: string
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToastContext()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const caseId = params.id as string

  useEffect(() => {
    fetchCaseAndMessages()
  }, [caseId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchCaseAndMessages = async () => {
    try {
      // Fetch case details
      const caseResponse = await fetch(API_ENDPOINTS.CASES.CASE(caseId))
      if (!caseResponse.ok) {
        throw new Error('Failed to fetch case details')
      }
      const caseData = await caseResponse.json()
      setCaseData(caseData)

      // For now, use mock messages - in real implementation, fetch from chat API
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Hello! I have a question about my employment contract review.',
          sender: 'client',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          content: 'Hi! I\'ve reviewed your contract and found several concerning clauses. Let me explain the issues I\'ve identified.',
          sender: 'lawyer',
          timestamp: new Date(Date.now() - 3000000).toISOString()
        },
        {
          id: '3',
          content: 'Thank you for the detailed review. Can you help me understand what these clauses mean in simple terms?',
          sender: 'client',
          timestamp: new Date(Date.now() - 2400000).toISOString()
        },
        {
          id: '4',
          content: 'Of course! Let me break down each clause and explain what they mean for your rights as an employee.',
          sender: 'lawyer',
          timestamp: new Date(Date.now() - 1800000).toISOString()
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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      // For now, simulate sending - in real implementation, send to chat API
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender: 'lawyer',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, message])
      setNewMessage('')

      // Simulate client response after 2 seconds
      setTimeout(() => {
        const clientResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Thank you for the clarification. This helps a lot!',
          sender: 'client',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, clientResponse])
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Handle file upload - in real implementation, upload to server
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
      <FreelancerLayout>
        <div className="p-4 md:p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading chat...</p>
          </div>
        </div>
      </FreelancerLayout>
    )
  }

  return (
    <FreelancerLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push(`/freelancer/dashboard/cases/${caseId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Case
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Chat with {caseData?.client_name || 'Client'}
                </h1>
                <p className="text-sm text-gray-600">{caseData?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{caseData?.status}</Badge>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Case Details
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'lawyer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                  message.sender === 'lawyer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.sender === 'client' && (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'lawyer' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.sender === 'lawyer' && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFileUpload}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full"
                disabled={sending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </FreelancerLayout>
  )
} 