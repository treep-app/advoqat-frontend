'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Briefcase,
  Upload,
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { API_ENDPOINTS } from '@/lib/config'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { DocumentUploadModal } from '@/components/ai/DocumentUploadModal'
import { DocumentChat } from '@/components/ai/DocumentChat'

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
  tokens_used?: number
  model_used?: string
}

interface Document {
  id: string
  original_name?: string
  originalName?: string
  extracted_text?: string
  extractedText?: string
  created_at?: string
  createdAt?: string
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
  { 
    icon: <FileText className="h-5 w-5" />, 
    title: 'Contract Law', 
    description: 'Contracts, agreements, and legal documents',
    keywords: ['contracts', 'agreements', 'terms', 'conditions', 'breach', 'enforcement']
  },
  { 
    icon: <Users className="h-5 w-5" />, 
    title: 'Employment Law', 
    description: 'Workplace rights and employment contracts',
    keywords: ['employment', 'workplace', 'discrimination', 'harassment', 'wages', 'termination']
  },
  { 
    icon: <Home className="h-5 w-5" />, 
    title: 'Real Estate', 
    description: 'Property law and real estate transactions',
    keywords: ['property', 'real estate', 'landlord', 'tenant', 'mortgage', 'deed']
  },
  { 
    icon: <Building2 className="h-5 w-5" />, 
    title: 'Business Law', 
    description: 'Corporate law and business formation',
    keywords: ['business', 'corporate', 'LLC', 'partnership', 'tax', 'compliance']
  },
  { 
    icon: <Briefcase className="h-5 w-5" />, 
    title: 'Family Law', 
    description: 'Marriage, divorce, and family matters',
    keywords: ['family', 'divorce', 'custody', 'child support', 'marriage', 'adoption']
  },
  { 
    icon: <Shield className="h-5 w-5" />, 
    title: 'Criminal Law', 
    description: 'Criminal defense and legal procedures',
    keywords: ['criminal', 'arrest', 'charges', 'defense', 'trial', 'sentencing']
  },
  { 
    icon: <Users className="h-5 w-5" />, 
    title: 'Immigration Law', 
    description: 'Visa, citizenship, and immigration matters',
    keywords: ['immigration', 'visa', 'citizenship', 'green card', 'deportation', 'asylum']
  },
  { 
    icon: <Shield className="h-5 w-5" />, 
    title: 'Intellectual Property', 
    description: 'Patents, trademarks, and copyright law',
    keywords: ['patent', 'trademark', 'copyright', 'intellectual property', 'IP', 'infringement']
  },
  { 
    icon: <FileText className="h-5 w-5" />, 
    title: 'Tax Law', 
    description: 'Tax planning and compliance',
    keywords: ['tax', 'IRS', 'deductions', 'credits', 'filing', 'audit']
  },
  { 
    icon: <Users className="h-5 w-5" />, 
    title: 'Personal Injury', 
    description: 'Accidents, negligence, and compensation',
    keywords: ['personal injury', 'accident', 'negligence', 'compensation', 'damages', 'liability']
  },
  { 
    icon: <Building2 className="h-5 w-5" />, 
    title: 'Bankruptcy Law', 
    description: 'Debt relief and financial restructuring',
    keywords: ['bankruptcy', 'debt', 'creditors', 'discharge', 'chapter 7', 'chapter 13']
  },
  { 
    icon: <Shield className="h-5 w-5" />, 
    title: 'Estate Planning', 
    description: 'Wills, trusts, and estate administration',
    keywords: ['estate', 'will', 'trust', 'probate', 'inheritance', 'power of attorney']
  }
]

const jurisdictions = [
  { country: 'United States', states: [
    { name: 'Alabama', code: 'AL' },
    { name: 'Alaska', code: 'AK' },
    { name: 'Arizona', code: 'AZ' },
    { name: 'Arkansas', code: 'AR' },
    { name: 'California', code: 'CA' },
    { name: 'Colorado', code: 'CO' },
    { name: 'Connecticut', code: 'CT' },
    { name: 'Delaware', code: 'DE' },
    { name: 'Florida', code: 'FL' },
    { name: 'Georgia', code: 'GA' },
    { name: 'Hawaii', code: 'HI' },
    { name: 'Idaho', code: 'ID' },
    { name: 'Illinois', code: 'IL' },
    { name: 'Indiana', code: 'IN' },
    { name: 'Iowa', code: 'IA' },
    { name: 'Kansas', code: 'KS' },
    { name: 'Kentucky', code: 'KY' },
    { name: 'Louisiana', code: 'LA' },
    { name: 'Maine', code: 'ME' },
    { name: 'Maryland', code: 'MD' },
    { name: 'Massachusetts', code: 'MA' },
    { name: 'Michigan', code: 'MI' },
    { name: 'Minnesota', code: 'MN' },
    { name: 'Mississippi', code: 'MS' },
    { name: 'Missouri', code: 'MO' },
    { name: 'Montana', code: 'MT' },
    { name: 'Nebraska', code: 'NE' },
    { name: 'Nevada', code: 'NV' },
    { name: 'New Hampshire', code: 'NH' },
    { name: 'New Jersey', code: 'NJ' },
    { name: 'New Mexico', code: 'NM' },
    { name: 'New York', code: 'NY' },
    { name: 'North Carolina', code: 'NC' },
    { name: 'North Dakota', code: 'ND' },
    { name: 'Ohio', code: 'OH' },
    { name: 'Oklahoma', code: 'OK' },
    { name: 'Oregon', code: 'OR' },
    { name: 'Pennsylvania', code: 'PA' },
    { name: 'Rhode Island', code: 'RI' },
    { name: 'South Carolina', code: 'SC' },
    { name: 'South Dakota', code: 'SD' },
    { name: 'Tennessee', code: 'TN' },
    { name: 'Texas', code: 'TX' },
    { name: 'Utah', code: 'UT' },
    { name: 'Vermont', code: 'VT' },
    { name: 'Virginia', code: 'VA' },
    { name: 'Washington', code: 'WA' },
    { name: 'West Virginia', code: 'WV' },
    { name: 'Wisconsin', code: 'WI' },
    { name: 'Wyoming', code: 'WY' }
  ]},
  { country: 'Canada', provinces: [
    { name: 'Alberta', code: 'AB' },
    { name: 'British Columbia', code: 'BC' },
    { name: 'Manitoba', code: 'MB' },
    { name: 'New Brunswick', code: 'NB' },
    { name: 'Newfoundland and Labrador', code: 'NL' },
    { name: 'Nova Scotia', code: 'NS' },
    { name: 'Ontario', code: 'ON' },
    { name: 'Prince Edward Island', code: 'PE' },
    { name: 'Quebec', code: 'QC' },
    { name: 'Saskatchewan', code: 'SK' },
    { name: 'Northwest Territories', code: 'NT' },
    { name: 'Nunavut', code: 'NU' },
    { name: 'Yukon', code: 'YT' }
  ]},
  { country: 'United Kingdom', regions: [
    { name: 'England', code: 'ENG' },
    { name: 'Scotland', code: 'SCT' },
    { name: 'Wales', code: 'WLS' },
    { name: 'Northern Ireland', code: 'NIR' }
  ]},
  { country: 'Australia', states: [
    { name: 'New South Wales', code: 'NSW' },
    { name: 'Victoria', code: 'VIC' },
    { name: 'Queensland', code: 'QLD' },
    { name: 'Western Australia', code: 'WA' },
    { name: 'South Australia', code: 'SA' },
    { name: 'Tasmania', code: 'TAS' },
    { name: 'Australian Capital Territory', code: 'ACT' },
    { name: 'Northern Territory', code: 'NT' }
  ]}
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
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<{country: string, region: string} | null>(null)
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false)
  const [showDocumentChat, setShowDocumentChat] = useState(false)
  const [sessionDocuments, setSessionDocuments] = useState<Document[]>([])
  const [hasDocuments, setHasDocuments] = useState(false)
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

  const fetchSessions = useCallback(async () => {
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
  }, [user])

  const fetchSessionDocuments = useCallback(async () => {
    if (!currentSession || !user) return

    try {
      const response = await fetch(`${API_ENDPOINTS.AI_ASSISTANT.DOCUMENTS(currentSession)}?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const documents = data.documents || []
        setSessionDocuments(documents)
        setHasDocuments(documents.length > 0)
      }
    } catch (error) {
      console.error('Error fetching session documents:', error)
    }
  }, [currentSession, user])

  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user, fetchSessions])

  // Fetch session documents when session changes
  useEffect(() => {
    if (currentSession && user) {
      fetchSessionDocuments()
    }
  }, [currentSession, user, fetchSessionDocuments])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
          userId: user.id,
          hasDocuments: hasDocuments,
          topic: selectedTopic,
          jurisdiction: selectedJurisdiction
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

  const startNewChat = (topic?: string, jurisdiction?: {country: string, region: string}) => {
    setCurrentSession(null)
    setMessages([])
    setShowChat(true)
    setSelectedTopic(topic || null)
    setSelectedJurisdiction(jurisdiction || null)
  }

  const startChatWithTopicAndJurisdiction = () => {
    if (!selectedTopic || !selectedJurisdiction) {
      toast({
        title: 'Selection Required',
        description: 'Please select both a topic and jurisdiction before starting the chat.',
        variant: 'destructive'
      })
      return
    }
    startNewChat(selectedTopic, selectedJurisdiction)
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

  // Show document chat if active
  if (showDocumentChat) {
    return (
      <AppLayout currentPage="/dashboard/ai-assistant">
        <div className="h-screen">
          <DocumentChat
            documents={sessionDocuments}
            sessionId={currentSession || undefined}
            userId={user?.id || ''}
            onClose={() => setShowDocumentChat(false)}
          />
        </div>
      </AppLayout>
    )
  }

  if (!showChat) {
    return (
      <AppLayout currentPage="/dashboard/ai-assistant">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Topic and Jurisdiction Selector */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                Start Your Legal Consultation
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Select a legal topic and your jurisdiction for personalized guidance
              </p>
              
              {/* Selection Summary */}
              {(selectedTopic || selectedJurisdiction?.country) && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                    {selectedTopic && (
                      <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Topic: {selectedTopic}</span>
                      </div>
                    )}
                    {selectedJurisdiction?.country && (
                      <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">
                          {selectedJurisdiction.region 
                            ? `${selectedJurisdiction.region}, ${selectedJurisdiction.country}`
                            : `${selectedJurisdiction.country}`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Topic Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Choose a Legal Topic</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {legalTopics.map((topic, index) => (
                    <Card 
                      key={index}
                      className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 bg-white/80 backdrop-blur-sm ${
                        selectedTopic === topic.title ? 'ring-2 ring-blue-500 shadow-lg' : ''
                      }`}
                      onClick={() => setSelectedTopic(topic.title)}
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
                          <span className="text-xs text-gray-500">
                            {selectedTopic === topic.title ? 'Selected' : 'Click to select'}
                          </span>
                          {selectedTopic === topic.title && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Jurisdiction Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Select Your Jurisdiction</h3>
                
                <div className="max-w-md mx-auto space-y-4">
                  {/* Country Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Country
                    </label>
                    <Select
                      value={selectedJurisdiction?.country || ''}
                      onValueChange={(value) => {
                        if (value === 'clear') {
                          setSelectedJurisdiction(null)
                        } else if (value) {
                          setSelectedJurisdiction({country: value, region: ''})
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose your country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clear">Clear selection</SelectItem>
                        {jurisdictions.map((jurisdiction) => (
                          <SelectItem key={jurisdiction.country} value={jurisdiction.country}>
                            {jurisdiction.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Region Dropdown - Only show if country is selected */}
                  {selectedJurisdiction?.country && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Region in {selectedJurisdiction.country}
                      </label>
                      <Select
                        value={selectedJurisdiction?.region || ''}
                        onValueChange={(value) => {
                          if (value === 'clear') {
                            setSelectedJurisdiction({...selectedJurisdiction, region: ''})
                          } else if (value) {
                            setSelectedJurisdiction({...selectedJurisdiction, region: value})
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={`Choose your region in ${selectedJurisdiction.country}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clear">Clear selection</SelectItem>
                          {jurisdictions
                            .find(j => j.country === selectedJurisdiction.country)
                            ?.states?.map((state) => (
                              <SelectItem key={state.code} value={state.name}>
                                {state.name}
                              </SelectItem>
                            ))}
                          {jurisdictions
                            .find(j => j.country === selectedJurisdiction.country)
                            ?.provinces?.map((province) => (
                              <SelectItem key={province.code} value={province.name}>
                                {province.name}
                              </SelectItem>
                            ))}
                          {jurisdictions
                            .find(j => j.country === selectedJurisdiction.country)
                            ?.regions?.map((region) => (
                              <SelectItem key={region.code} value={region.name}>
                                {region.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Selected Jurisdiction Display */}
                  {selectedJurisdiction?.region && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">
                          Selected: {selectedJurisdiction.region}, {selectedJurisdiction.country}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedJurisdiction(null)}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Start Chat Button */}
              <div className="text-center space-y-3">
                <Button 
                  onClick={startChatWithTopicAndJurisdiction}
                  disabled={!selectedTopic || !selectedJurisdiction}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Specialized Chat
                </Button>
                
                <div className="text-center">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => startNewChat()}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Or start a general conversation
                  </Button>
                </div>
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
                  onClick={() => {
                    setShowChat(false)
                    setSelectedTopic(null)
                    setSelectedJurisdiction(null)
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back to Topic Selection
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedTopic || 'Legal Assistant'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedJurisdiction ? `${selectedJurisdiction.region}, ${selectedJurisdiction.country}` : 'AI-powered legal guidance'}
                    </p>
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
            {/* Document Context Banner */}
            {hasDocuments && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Document Analysis Mode</h3>
                      <p className="text-sm text-blue-700">
                        AI is analyzing {sessionDocuments.length} document(s) for contextual responses
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDocumentUploadModal(true)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Documents
                  </Button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="h-[600px] overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
                    <Bot className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Welcome to AI Legal Assistant
                    {selectedTopic && (
                      <span className="block text-lg font-normal text-blue-600 mt-2">
                        Specialized in {selectedTopic}
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    {selectedTopic && selectedJurisdiction ? (
                      `I'm here to help you with ${selectedTopic.toLowerCase()} questions specific to ${selectedJurisdiction.region}, ${selectedJurisdiction.country}. I'll provide guidance based on the laws and regulations in your jurisdiction.`
                    ) : (
                      "I'm here to help you with legal questions and provide educational guidance. Upload your documents for personalized analysis or ask me anything about legal matters!"
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {selectedTopic ? (
                      // Show topic-specific suggestions
                      <>
                        {selectedTopic === 'Contract Law' && (
                          <>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;What makes a contract valid?&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Breach of contract remedies&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Contract termination clauses&quot;
                            </Badge>
                          </>
                        )}
                        {selectedTopic === 'Employment Law' && (
                          <>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Workplace discrimination&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Wrongful termination&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Employee rights&quot;
                            </Badge>
                          </>
                        )}
                        {selectedTopic === 'Family Law' && (
                          <>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Divorce process&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Child custody laws&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Child support calculation&quot;
                            </Badge>
                          </>
                        )}
                        {selectedTopic === 'Real Estate' && (
                          <>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Property purchase process&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Landlord tenant rights&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Mortgage requirements&quot;
                            </Badge>
                          </>
                        )}
                        {selectedTopic === 'Business Law' && (
                          <>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;LLC formation&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Business contracts&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Corporate compliance&quot;
                            </Badge>
                          </>
                        )}
                        {selectedTopic === 'Criminal Law' && (
                          <>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Criminal defense rights&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Bail and bond process&quot;
                            </Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 px-3 py-1">
                              &quot;Plea bargaining&quot;
                            </Badge>
                          </>
                        )}
                      </>
                    ) : (
                      // Show general suggestions
                      <>
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
                      </>
                    )}
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-blue-50 px-3 py-1 border-blue-200 text-blue-600"
                      onClick={() => setShowDocumentUploadModal(true)}
                    >
                      📄 Upload Documents
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
                        {msg.role === 'assistant' && hasDocuments && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                            <FileText className="h-3 w-3" />
                            <span>Analyzing your documents for context</span>
                          </div>
                        )}
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
                      <span className="text-sm text-gray-600">processing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 p-6 bg-gray-50/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={hasDocuments ? "Ask about your documents or any legal question..." : "Ask me any legal question..."}
                    className="bg-white border-gray-200 focus:border-blue-500 rounded-xl shadow-sm pr-12"
                    disabled={sending}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDocumentUploadModal(true)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
                    disabled={sending}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
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
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {hasDocuments && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium">
                        {sessionDocuments.length} document(s) loaded
                      </span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDocumentUploadModal(true)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload Documents
                  </Button>
                  {hasDocuments && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDocumentChat(true)}
                      className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Chat with Documents
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  This AI provides educational legal information only. For specific legal advice, consult a qualified attorney.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showDocumentUploadModal}
        onClose={() => setShowDocumentUploadModal(false)}
        sessionId={currentSession || undefined}
        userId={user?.id || ''}
        onDocumentsUploaded={(documents) => {
          setSessionDocuments(prev => [...prev, ...documents])
          setHasDocuments(true)
        }}
        onDocumentsChanged={() => {
          fetchSessionDocuments()
        }}
        onStartDocumentChat={(documents) => {
          setSessionDocuments(documents)
          setHasDocuments(true)
          setShowDocumentUploadModal(false)
          setShowDocumentChat(true)
        }}
      />
    </AppLayout>
  )
} 