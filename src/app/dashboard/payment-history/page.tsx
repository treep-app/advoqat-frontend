'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToastContext } from '@/components/ui/toast-context'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Download, 
  Filter, 
  Search, 
  Calendar,
  CreditCard,
  FileText,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  TrendingDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { API_ENDPOINTS } from '@/lib/config'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface PaymentRecord {
  id: number
  amount: number
  currency: string
  paymentMethod: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  serviceType: 'consultation' | 'document_download'
  description: string
  createdAt: string
  updatedAt: string
  stripeSessionId: string
  stripePaymentIntentId: string
  consultation?: {
    lawyerName: string
    date: string
    method: string
  }
  document?: {
    name: string
    type: string
  }
}

interface PaymentStats {
  totalPayments: number
  successfulPayments: number
  failedPayments: number
  totalSpent: number
  consultationPayments: number
  documentPayments: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PaymentHistoryPage() {
  const router = useRouter()
  const { toast } = useToastContext()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    serviceType: 'all',
    status: 'all',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (!user) {
          router.push('/auth/signin')
          return
        }
      } catch (error) {
        console.error('Error getting user:', error)
        router.push('/auth/signin')
      }
    }

    getUser()
  }, [router])

  useEffect(() => {
    if (user) {
      fetchPaymentHistory()
      fetchPaymentStats()
    }
  }, [user, currentPage, filters])

  const fetchPaymentHistory = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        userId: user.id,
        page: currentPage.toString(),
        limit: '10'
      })

      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.serviceType && filters.serviceType !== 'all') params.append('serviceType', filters.serviceType)
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)

      const response = await fetch(`${API_ENDPOINTS.PAYMENT_HISTORY.LIST}?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history')
      }

      const data = await response.json()
      setPayments(data.payments)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching payment history:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentStats = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`${API_ENDPOINTS.PAYMENT_HISTORY.STATS}?userId=${user.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment stats')
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching payment stats:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      case 'refunded':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            <TrendingDown className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'consultation':
        return <Users className="h-4 w-4" />
      case 'document_download':
        return <FileText className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const downloadPaymentHistory = () => {
    // Create CSV content
    const headers = ['Date', 'Amount', 'Service Type', 'Status', 'Description']
    const rows = payments.map(payment => [
      new Date(payment.createdAt).toLocaleDateString(),
      formatAmount(payment.amount, payment.currency),
      payment.serviceType,
      payment.status,
      payment.description
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast({
      title: 'Download Complete',
      description: 'Payment history has been downloaded',
      variant: 'default'
    })
  }

  if (loading && !payments.length) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Payment History</h1>
              <p className="text-gray-600">Track your transactions and billing records</p>
            </div>
          </div>
          <Button onClick={downloadPaymentHistory} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Payment Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPayments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.successfulPayments} successful
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(stats.totalSpent / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all transactions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.consultationPayments}</div>
                <p className="text-xs text-muted-foreground">
                  Legal consultations
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.documentPayments}</div>
                <p className="text-xs text-muted-foreground">
                  Document downloads
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Service Type</label>
                <Select value={filters.serviceType} onValueChange={(value) => handleFilterChange('serviceType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="consultation">Consultations</SelectItem>
                    <SelectItem value="document_download">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search payments..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History List */}
        <div className="space-y-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment History</h3>
                <p className="text-gray-600 text-center">
                  You haven&apos;t made any payments yet. Your payment history will appear here once you make your first transaction.
                </p>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getServiceTypeIcon(payment.serviceType)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {formatAmount(payment.amount, payment.currency)}
                          </h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        
                        <p className="text-gray-600 mb-2">{payment.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </span>
                          
                          {payment.consultation && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {payment.consultation.lawyerName}
                            </span>
                          )}
                          
                          {payment.document && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {payment.document.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500 capitalize">
                        {payment.serviceType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {payment.paymentMethod}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  )
} 