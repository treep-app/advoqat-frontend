'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToastContext } from '@/components/ui/toast-context'
import { 
  Send, 
  Bot, 
  User,
  Loader2,
  Trash2,
  Brain,
  Sparkles,
  Shield,
  ChevronRight,
  Copy,
  HelpCircle,

  FileText,
  Users,
  Home,
  Building2,
  Briefcase
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { API_ENDPOINTS } from '@/lib/config'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
  tokens_used?: number
  model_used?: string
}

interface ChatSession {
  id: string
  title: string
  category: string
  status: string
  created_at: string
  updated_at: string
  message_count: number
  last_message_at: string
}

const legalTopics = [
  { icon: <FileText className="h-5 w-5" />, title: 'Contract Law', description: 'Contracts, agreements, and legal documents' },
  { icon: <Users className="h-5 w-5" />, title: 'Employment Law', description: 'Workplace rights and employment contracts' },
  { icon: <Home className="h-5 w-5" />, title: 'Real Estate', description: 'Property law and real estate transactions' },
  { icon: <Building2 className="h-5 w-5" />, title: 'Business Law', description: 'Corporate law and business formation' },
  { icon: <Briefcase className="h-5 w-5" />, title: 'Family Law', description: 'Marriage, divorce, and family matters' },
  { icon: <Shield className="h-5 w-5" />, title: 'Criminal Law', description: 'Criminal defense and legal procedures' }
]

export default function AIAssistantPage() {
  const router = useRouter()
  const { toast } = useToastContext()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [showChat, setShowChat] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      fetchSessions()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchSessions = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`${API_ENDPOINTS.AI_ASSISTANT.SESSIONS}?userId=${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setSessions(data.sessions)
      } else {
        console.error('Failed to fetch sessions:', data.error)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const fetchSession = async (sessionId: string) => {
    if (!user) return
    
    try {
      const response = await fetch(`${API_ENDPOINTS.AI_ASSISTANT.SESSION(sessionId)}?userId=${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.messages)
        setCurrentSession(sessionId)
        setShowChat(true)
      } else {
        console.error('Failed to fetch session:', data.error)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !user || sending) return

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
          sessionId: currentSession,
          message: userMessage,
          userId: user.id
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

      // Update current session if it's a new one
      if (!currentSession && data.sessionId) {
        setCurrentSession(data.sessionId)
        fetchSessions() // Refresh sessions list
      }

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

  const startNewChat = (topic?: string) => {
    setCurrentSession(null)
    setMessages([])
    setShowChat(true)
    setSelectedTopic(topic || null)
  }

  const deleteSession = async (sessionId: string) => {
    if (!user) return
    
    try {
      const response = await fetch(`${API_ENDPOINTS.AI_ASSISTANT.SESSION(sessionId)}?userId=${user.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchSessions()
        if (currentSession === sessionId) {
          startNewChat()
        }
        toast({
          title: 'Session Deleted',
          description: 'Chat session deleted successfully',
          variant: 'success'
        })
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive'
      })
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard',
      variant: 'success'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading AI Assistant...</p>
        </div>
      </div>
    )
  }

  if (!showChat) {
    return (
      <AppLayout currentPage="/dashboard/ai-assistant">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Quick Start */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                Start Your Legal Consultation
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Choose a topic or start a general conversation
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {legalTopics.map((topic, index) => (
                  <Card 
                    key={index}
                    className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 bg-white/80 backdrop-blur-sm"
                    onClick={() => startNewChat(topic.title)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                          {topic.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {topic.title}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600">
                            {topic.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Click to start</span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => startNewChat()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start General Chat
                </Button>
              </div>
            </div>

            {/* Recent Sessions */}
            {sessions.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Conversations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.slice(0, 6).map((session) => (
                    <Card 
                      key={session.id}
                      className="cursor-pointer transition-all duration-300 hover:shadow-lg border-0 bg-white/80 backdrop-blur-sm"
                      onClick={() => fetchSession(session.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout currentPage="/dashboard/ai-assistant">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Chat Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowChat(false)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back to Topics
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedTopic || 'Legal Assistant'}
                    </h2>
                    <p className="text-sm text-gray-500">AI-powered legal guidance</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>About AI Legal Assistant</DialogTitle>
                      <DialogDescription>
                        This AI provides educational legal information only. For specific legal advice, 
                        please consult with a qualified attorney in your jurisdiction.
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            {/* Messages Area */}
            <div className="h-[600px] overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
                    <Bot className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Welcome to AI Legal Assistant
                  </h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    I&apos;m here to help you with legal questions and provide educational guidance. 
                    Ask me anything about legal matters!
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                      &quot;What makes a contract valid?&quot;
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                      &quot;Employment law basics&quot;
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                      &quot;Real estate contracts&quot;
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                      &quot;Business formation&quot;
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
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 p-6 bg-gray-50/50">
              <div className="flex gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask me any legal question..."
                  className="flex-1 bg-white border-gray-200 focus:border-blue-500 rounded-xl shadow-sm"
                  disabled={sending}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 rounded-xl shadow-sm"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                This AI provides educational legal information only. For specific legal advice, consult a qualified attorney.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 