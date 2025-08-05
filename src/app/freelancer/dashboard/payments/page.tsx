'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Building2,
  Wallet
} from 'lucide-react'
import FreelancerLayout from '@/components/layout/freelancer-layout'
import { API_ENDPOINTS } from '@/lib/config'

interface Payment {
  id: number
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  payment_method: string
  description: string
  created_at: string
  completed_at?: string
  case_id?: number
  booking_id?: number
  type: 'case_payment' | 'consultation_payment' | 'withdrawal'
}

interface Earnings {
  total_earnings: number
  pending_earnings: number
  this_month: number
  last_month: number
  total_cases: number
  completed_cases: number
  average_per_case: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [earnings, setEarnings] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(storedUserId)
      fetchData(storedUserId)
    }
  }, [])

  const fetchData = async (id: string) => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch earnings
      const earningsResponse = await fetch(API_ENDPOINTS.FREELANCERS.EARNINGS(id))
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json()
        setEarnings(earningsData)
      }

      // Fetch payment history
      const paymentsResponse = await fetch(API_ENDPOINTS.PAYMENT_HISTORY.LIST)
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        setPayments(paymentsData)
      } else {
        setError('Failed to fetch payment data')
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
      setError('Failed to fetch payment data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case 'completed':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'case_payment':
        return <DollarSign className="h-4 w-4" />
      case 'consultation_payment':
        return <Calendar className="h-4 w-4" />
      case 'withdrawal':
        return <Building2 className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getFilteredPayments = (type: string) => {
    if (type === 'all') return payments
    return payments.filter(p => p.type === type)
  }

  if (loading) {
    return (
      <FreelancerLayout>
        <div className="p-4 md:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-4">Loading Payments...</h1>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </FreelancerLayout>
    )
  }

  return (
    <FreelancerLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments & Earnings</h1>
            <p className="text-gray-600">Track your earnings and payment history</p>
          </div>
          <Button onClick={() => userId && fetchData(userId)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Earnings Overview */}
        {earnings && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(earnings.total_earnings)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(earnings.pending_earnings)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(earnings.this_month)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg per Case</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(earnings.average_per_case)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Case Statistics */}
        {earnings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Cases</p>
                  <p className="text-3xl font-bold text-gray-900">{earnings.total_cases}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Completed Cases</p>
                  <p className="text-3xl font-bold text-green-600">{earnings.completed_cases}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {earnings.total_cases > 0 
                      ? Math.round((earnings.completed_cases / earnings.total_cases) * 100)
                      : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Payments</TabsTrigger>
                <TabsTrigger value="case_payment">Case Payments</TabsTrigger>
                <TabsTrigger value="consultation_payment">Consultations</TabsTrigger>
                <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
              </TabsList>

              {['all', 'case_payment', 'consultation_payment', 'withdrawal'].map((type) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {getFilteredPayments(type).length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                      <p className="text-gray-600">
                        {type === 'all' 
                          ? "You don't have any payment history yet."
                          : `No ${type.replace('_', ' ')} payments found.`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getFilteredPayments(type).map((payment) => (
                        <Card key={payment.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  {getPaymentTypeIcon(payment.type)}
                                </div>
                                <div>
                                  <h3 className="font-semibold">{payment.description}</h3>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(payment.created_at)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {payment.payment_method}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-600">
                                  {formatCurrency(payment.amount, payment.currency)}
                                </p>
                                {getStatusBadge(payment.status)}
                              </div>
                            </div>
                            
                            {payment.completed_at && (
                              <div className="mt-2 text-sm text-gray-500">
                                Completed: {formatDate(payment.completed_at)}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Withdrawal Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Withdraw Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Available for Withdrawal</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <span className="font-medium">Pending Earnings</span>
                    <span className="text-lg font-bold text-green-600">
                      {earnings ? formatCurrency(earnings.pending_earnings) : '$0.00'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium">Minimum Withdrawal</span>
                    <span className="text-lg font-bold text-blue-600">$50.00</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Withdrawal Methods</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bank Transfer
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    PayPal
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Wallet className="h-4 w-4 mr-2" />
                    Stripe
                  </Button>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Withdrawals are processed within 3-5 business days
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FreelancerLayout>
  )
} 