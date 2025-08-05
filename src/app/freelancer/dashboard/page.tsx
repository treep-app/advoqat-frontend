'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Clock, CheckCircle } from 'lucide-react'
import FreelancerLayout from '@/components/layout/freelancer-layout'
import { useRouter } from 'next/navigation'

export default function FreelancerDashboard() {
  const router = useRouter()
  
  return (
    <FreelancerLayout>
      {/* Main Content Area */}
      <div className="p-4 md:p-8 space-y-8">
        <div className="text-center text-green-600 py-4">
          <h2 className="text-2xl font-bold mb-4">Welcome to Lawyer Dashboard!</h2>
          <p>Manage your cases, earnings, and profile from one place.</p>
        </div>
        
        {/* Quick Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" /> Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">$0</div>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" /> Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">0</div>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" /> Active Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">0</div>
            </CardContent>
          </Card>
        </section>

                 {/* Case Inbox Preview */}
         <section>
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Clock className="h-5 w-5 text-blue-600" /> Case Inbox
               </CardTitle>
               <p className="text-sm text-gray-600">Available and assigned cases</p>
             </CardHeader>
             <CardContent>
               <div className="text-center py-8">
                 <div className="text-gray-400 mb-4">No cases to display.</div>
                 <Button onClick={() => router.push('/freelancer/dashboard/cases')}>
                   <Clock className="h-4 w-4 mr-2" />
                   View All Cases
                 </Button>
               </div>
             </CardContent>
           </Card>
         </section>
      </div>
    </FreelancerLayout>
  )
} 