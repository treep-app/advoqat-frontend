'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Users, 
  Clock, 
  ArrowRight,
  Brain,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { BACKEND_URL } from '@/lib/config'

interface ActivityItem {
  id: string
  type: 'ai_conversation' | 'document' | 'consultation'
  title: string
  description: string
  timestamp: string
  status?: string
  icon: React.ReactNode
  color: string
  bgColor: string
  href: string
}

interface RecentActivityProps {
  userId: string
}

export function RecentActivity({ userId }: RecentActivityProps) {
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalDocuments: 0,
    totalConsultations: 0
  })

  useEffect(() => {
    fetchRecentActivity(1)
    setCurrentPage(1)
  }, [userId])

  const handleNextPage = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchRecentActivity(nextPage)
  }

  const handlePrevPage = () => {
    const prevPage = currentPage - 1
    if (prevPage >= 1) {
      setCurrentPage(prevPage)
      fetchRecentActivity(prevPage)
    }
  }

  const fetchRecentActivity = useCallback(async (page = 1) => {
    if (!userId) return

    setLoading(true)
    try {
      const limit = 3
      const offset = (page - 1) * limit

      // Fetch recent AI conversations
      const aiResponse = await fetch(`${BACKEND_URL}/api/v1/ai/sessions?userId=${userId}&limit=${limit}&offset=${offset}`)
      const aiData = aiResponse.ok ? await aiResponse.json() : { sessions: [] }

      // Fetch recent documents
      const docsResponse = await fetch(`${BACKEND_URL}/api/v1/documents/recent?userId=${userId}&limit=${limit}&offset=${offset}`)
      const docsData = docsResponse.ok ? await docsResponse.json() : { documents: [] }

      // Fetch recent consultations
      const consultationsResponse = await fetch(`${BACKEND_URL}/api/consultations/recent?userId=${userId}&limit=${limit}&offset=${offset}`)
      const consultationsData = consultationsResponse.ok ? await consultationsResponse.json() : { consultations: [] }

      // Transform data into activity items
      const activityItems: ActivityItem[] = []

      // Add AI conversations
      aiData.sessions?.forEach((session: { id: string; title?: string; message_count?: number; updated_at?: string; created_at?: string }) => {
        activityItems.push({
          id: session.id,
          type: 'ai_conversation',
          title: session.title || 'Legal Query',
          description: `AI conversation with ${session.message_count || 0} messages`,
          timestamp: session.updated_at || session.created_at,
          status: 'completed',
          icon: <Brain className="h-4 w-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          href: `/dashboard/ai-assistant?session=${session.id}`
        })
      })

      // Add documents
      docsData.documents?.forEach((doc: { id: string; template_name?: string; status?: string; created_at?: string }) => {
        activityItems.push({
          id: doc.id,
          type: 'document',
          title: doc.template_name || 'Legal Document',
          description: doc.status === 'generated' ? 'Document generated successfully' : 'Document in progress',
          timestamp: doc.created_at,
          status: doc.status,
          icon: <FileText className="h-4 w-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          href: `/dashboard/documents/${doc.id}`
        })
      })

      // Add consultations
      consultationsData.consultations?.forEach((consultation: { id: string; lawyer_name?: string; status?: string; created_at?: string }) => {
        activityItems.push({
          id: consultation.id,
          type: 'consultation',
          title: `Consultation with ${consultation.lawyer_name || 'Lawyer'}`,
          description: consultation.status === 'completed' ? 'Consultation completed' : 'Consultation scheduled',
          timestamp: consultation.created_at,
          status: consultation.status,
          icon: <Users className="h-4 w-4" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          href: `/dashboard/consultations/${consultation.id}`
        })
      })

              // Sort by timestamp (most recent first)
        activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setActivities(activityItems.slice(0, 3)) // Show only 3 activities per page
        
        // Check if there are more activities based on API responses
        const hasMoreActivities = 
          (aiData.hasMore || false) || 
          (docsData.hasMore || false) || 
          (consultationsData.hasMore || false) ||
          activityItems.length > 3
        setHasMore(hasMoreActivities)

              // Update stats with total counts
        setStats({
          totalConversations: aiData.total || aiData.sessions?.length || 0,
          totalDocuments: docsData.total || docsData.documents?.length || 0,
          totalConsultations: consultationsData.total || consultationsData.consultations?.length || 0
        })

    } catch (error) {
      console.error('Error fetching recent activity:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'generated':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Generated</Badge>
      default:
        return <Badge variant="outline">Active</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your recent legal queries and documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">AI Conversations</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Documents</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Consultations</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalConsultations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your recent legal queries and documents</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-600"
              onClick={() => router.push('/dashboard/payment-history')}
            >
              View All Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-500 mb-6">Start by asking a legal question or creating a document!</p>
                             <div className="flex gap-3 justify-center">
                 <Button 
                   size="sm" 
                   className="bg-blue-600 hover:bg-blue-700"
                   onClick={() => router.push('/dashboard/ai-assistant')}
                 >
                   <Brain className="h-4 w-4 mr-2" />
                   Ask AI
                 </Button>
                 <Button 
                   size="sm" 
                   variant="outline"
                   onClick={() => router.push('/dashboard/documents')}
                 >
                   <FileText className="h-4 w-4 mr-2" />
                   Create Document
                 </Button>
               </div>
            </div>
          ) : (
                         <div className="space-y-4">
               {activities.map((activity) => (
                 <div
                   key={activity.id}
                   className="flex items-center space-x-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group"
                   onClick={() => router.push(activity.href)}
                 >
                   <div className={`w-10 h-10 ${activity.bgColor} rounded-lg flex items-center justify-center`}>
                     <div className={activity.color}>
                       {activity.icon}
                     </div>
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between">
                       <h4 className="text-sm font-semibold text-gray-900 truncate">
                         {activity.title}
                       </h4>
                       <div className="flex items-center space-x-2">
                         {activity.status && getStatusBadge(activity.status)}
                         <span className="text-xs text-gray-500 flex items-center">
                           <Clock className="h-3 w-3 mr-1" />
                           {formatTimestamp(activity.timestamp)}
                         </span>
                       </div>
                     </div>
                     <p className="text-sm text-gray-600 mt-1">
                       {activity.description}
                     </p>
                   </div>
                   
                   <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                 </div>
               ))}
               
               {/* Pagination Controls */}
               {(currentPage > 1 || hasMore) && (
                 <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={handlePrevPage}
                     disabled={currentPage <= 1}
                     className="flex items-center space-x-2"
                   >
                     <ChevronLeft className="h-4 w-4" />
                     <span>Previous</span>
                   </Button>
                   
                   <span className="text-sm text-gray-500">
                     Page {currentPage}
                   </span>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={handleNextPage}
                     disabled={!hasMore}
                     className="flex items-center space-x-2"
                   >
                     <span>Next</span>
                     <ChevronRight className="h-4 w-4" />
                   </Button>
                 </div>
               )}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 