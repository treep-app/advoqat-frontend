'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Scale, User, MessageCircle, Calendar, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image';

type Lawyer = {
  id: string;
  fullName: string;
  specialty: string[];
  availability: string[];
  avatarUrl: string;
};

type Consultation = {
  id: string;
  lawyerName: string;
  datetime: string;
  method: string;
  roomUrl?: string;
  status: string;
  notes?: string; // Added for notes
};

type User = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string };
};

export default function ConsultationsDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('find')
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Booking form state
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingMethod, setBookingMethod] = useState<'video' | 'chat'>('video')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  // Feedback form state
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackComments, setFeedbackComments] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Cancel/Reschedule state
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)

  // Reschedule modal state
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')

  // Lawyer profile modal state
  const [showLawyerProfile, setShowLawyerProfile] = useState(false)
  const [profileLawyer, setProfileLawyer] = useState<Lawyer | null>(null)

  // Feedback tracking (simulate feedback left for demo; in real app, fetch from backend)
  const [feedbackGiven, setFeedbackGiven] = useState<{ [consultationId: string]: boolean }>({})

  // Lawyer search/filter state
  const [lawyerSearch, setLawyerSearch] = useState('')

  // Toast notification state
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Show toast for upcoming consultations within the next hour
  useEffect(() => {
    const now = new Date();
    const soon = new Date(now.getTime() + 60 * 60 * 1000);
    const nextConsult = consultations.find(c => new Date(c.datetime) > now && new Date(c.datetime) <= soon && c.status === 'confirmed');
    if (nextConsult) {
      setToastMsg(`You have a consultation with ${nextConsult.lawyerName} at ${new Date(nextConsult.datetime).toLocaleTimeString()}`);
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [consultations]);

  console.log(`consultations: ${consultations}`)

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/auth/signin')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [router])

  // Fetch lawyers
  useEffect(() => {
    if (!user) return
    fetch('/api/lawyers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLawyers(data)
        } else {
          setLawyers([]) // fallback to empty array on error
          // Optionally: show a toast or error message here
        }
      })
  }, [user])

  // Fetch consultations
  useEffect(() => {
    if (!user) return
    fetch('/api/consultations/my')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setConsultations(data)
      } else {
        setConsultations([]) // or handle error: set an error state
        // Optionally: show a toast or error message
      }
    })
  }, [user, showBooking, showFeedback])

  // Handle booking submit
  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLawyer || !bookingDate || !bookingTime) return
    setBookingLoading(true)
    setMessage(null)
    try {
      const datetime = new Date(`${bookingDate}T${bookingTime}`)
      const res = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          lawyerId: selectedLawyer.id,
          datetime: datetime.toISOString(),
          method: bookingMethod,
          notes: bookingNotes
        })
      })
      if (!res.ok) throw new Error('Booking failed')
      setShowBooking(false)
      setBookingDate('')
      setBookingTime('')
      setBookingNotes('')
      setMessage({ type: 'success', text: 'Consultation booked!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to book consultation.' })
    } finally {
      setBookingLoading(false)
    }
  }

  // Handle feedback submit
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConsultation) return
    setFeedbackLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/consultations/${selectedConsultation.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackRating,
          comments: feedbackComments
        })
      })
      if (!res.ok) throw new Error('Feedback failed')
      setShowFeedback(false)
      setFeedbackComments('')
      setMessage({ type: 'success', text: 'Feedback submitted!' })
      if (selectedConsultation) {
        setFeedbackGiven(prev => ({ ...prev, [selectedConsultation.id]: true }))
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to submit feedback.' })
    } finally {
      setFeedbackLoading(false)
    }
  }

  // Handle cancel
  const handleCancelConsultation = async (consultation: Consultation) => {
    setRescheduleLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/consultations/${consultation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      })
      if (!res.ok) throw new Error('Cancel failed')
      setMessage({ type: 'success', text: 'Consultation cancelled.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to cancel consultation.' })
    } finally {
      setRescheduleLoading(false)
    }
  }

  // Handle reschedule
  const handleRescheduleConsultation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConsultation || !rescheduleDate || !rescheduleTime) return
    setRescheduleLoading(true)
    setMessage(null)
    try {
      const newDatetime = new Date(`${rescheduleDate}T${rescheduleTime}`)
      const res = await fetch(`/api/consultations/${selectedConsultation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reschedule', newDatetime: newDatetime.toISOString() })
      })
      if (!res.ok) throw new Error('Reschedule failed')
      setShowReschedule(false)
      setRescheduleDate('')
      setRescheduleTime('')
      setMessage({ type: 'success', text: 'Consultation rescheduled.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to reschedule consultation.' })
    } finally {
      setRescheduleLoading(false)
    }
  }

  // Add to Calendar helper
  function getGoogleCalendarUrl(consultation: Consultation) {
    const start = new Date(consultation.datetime);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 min default
    const details = encodeURIComponent('LegaliQ Consultation');
    const location = encodeURIComponent(consultation.roomUrl || '');
    const text = encodeURIComponent(`Consultation with ${consultation.lawyerName}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start.toISOString().replace(/[-:]|\.\d{3}/g, '')}/${end.toISOString().replace(/[-:]|\.\d{3}/g, '')}&details=${details}&location=${location}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Scale className="h-12 w-12 text-blue-600 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Scale className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LegaliQ</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-700">{user?.user_metadata?.full_name || user?.email}</span>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Legal Consultations</h1>
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
        )}
        <Tabs defaultValue="find" value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="find">Find a Lawyer</TabsTrigger>
            <TabsTrigger value="my">My Consultations</TabsTrigger>
          </TabsList>
          {/* Find a Lawyer Tab */}
          <TabsContent value="find">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  placeholder="Search by name or specialty..."
                  value={lawyerSearch}
                  onChange={e => setLawyerSearch(e.target.value)}
                />
              </div>
              {lawyers
                .filter(lawyer =>
                  lawyer.fullName.toLowerCase().includes(lawyerSearch.toLowerCase()) ||
                  lawyer.specialty.some((s: string) => s.toLowerCase().includes(lawyerSearch.toLowerCase()))
                )
                .map(lawyer => (
                <Card key={lawyer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Image
                      src={lawyer.avatarUrl}
                      alt={lawyer.fullName}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border cursor-pointer"
                      onClick={() => { setProfileLawyer(lawyer); setShowLawyerProfile(true); }}
                      title="View profile"
                    />
                    <div>
                      <CardTitle className="cursor-pointer" onClick={() => { setProfileLawyer(lawyer); setShowLawyerProfile(true); }} title="View profile">{lawyer.fullName}</CardTitle>
                      <CardDescription>{lawyer.specialty.join(', ')}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 text-sm text-gray-600">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Next available: {lawyer.availability[0] ? new Date(lawyer.availability[0]).toLocaleString() : 'N/A'}
                    </div>
                    <Button onClick={() => { setSelectedLawyer(lawyer); setShowBooking(true); }} className="w-full bg-blue-600 hover:bg-blue-700">Book Consultation</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          {/* My Consultations Tab */}
          <TabsContent value="my">
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              {/* Upcoming Consultations */}
              <TabsContent value="upcoming">
                <div className="space-y-6">
                  {consultations.filter(c => new Date(c.datetime) > new Date()).length === 0 ? (
                    <div className="text-gray-500 text-center py-12">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No upcoming consultations.</p>
                    </div>
                  ) : (
                    consultations.filter(c => new Date(c.datetime) > new Date()).map(consultation => {
                      const isConfirmed = consultation.status === 'confirmed';
                      return (
                        <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <CardTitle>{consultation.lawyerName}</CardTitle>
                            <CardDescription>
                              {new Date(consultation.datetime).toLocaleString()} &middot; {consultation.method}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                consultation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                consultation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                consultation.status === 'rescheduled' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {consultation.status}
                              </span>
                              {consultation.roomUrl && isConfirmed ? (
                                <Button size="sm" variant="outline" onClick={() => window.open(consultation.roomUrl, '_blank')} title="Join session">Join</Button>
                              ) : null}
                              {consultation.roomUrl && isConfirmed && (
                                <a
                                  href={getGoogleCalendarUrl(consultation)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block ml-2 text-xs text-blue-600 underline"
                                  title="Add to Google Calendar"
                                >
                                  Add to Calendar
                                </a>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" title="Leave feedback for this consultation" onClick={() => { setSelectedConsultation(consultation); setShowFeedback(true); }} disabled={feedbackLoading}>Feedback</Button>
                              <Button size="sm" variant="outline" title="Reschedule this consultation" onClick={() => { setSelectedConsultation(consultation); setShowReschedule(true); setRescheduleDate(''); setRescheduleTime(''); }} disabled={rescheduleLoading}>Reschedule</Button>
                              <Button size="sm" variant="destructive" title="Cancel this consultation" onClick={() => handleCancelConsultation(consultation)} disabled={rescheduleLoading}>Cancel</Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
              {/* Past Consultations */}
              <TabsContent value="past">
                <div className="space-y-6">
                  {consultations.filter(c => new Date(c.datetime) <= new Date()).length === 0 ? (
                    <div className="text-gray-500 text-center py-12">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No past consultations.</p>
                    </div>
                  ) : (
                    consultations.filter(c => new Date(c.datetime) <= new Date()).map(consultation => {
                      const statusColor =
                        consultation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        consultation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        consultation.status === 'rescheduled' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500';
                      const needsFeedback = !feedbackGiven[consultation.id] && consultation.status === 'confirmed';
                      return (
                        <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <CardTitle>{consultation.lawyerName}</CardTitle>
                            <CardDescription>
                              {new Date(consultation.datetime).toLocaleString()} &middot; {consultation.method}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${statusColor}`}>{consultation.status}</span>
                              {consultation.roomUrl && consultation.status === 'confirmed' ? (
                                <Button size="sm" variant="outline" disabled>Completed</Button>
                              ) : null}
                              {consultation.notes && (
                                <div className="text-xs text-gray-500 mt-2">Notes: {consultation.notes}</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {needsFeedback ? (
                                <Button size="sm" variant="outline" title="Leave feedback for this consultation" onClick={() => { setSelectedConsultation(consultation); setShowFeedback(true); }}>Leave Feedback</Button>
                              ) : (
                                <span className="text-xs text-gray-400">Feedback submitted</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
        {showBooking && selectedLawyer && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Book Consultation with {selectedLawyer.fullName}</h2>
              <form onSubmit={handleBookConsultation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" className="w-full border rounded p-2" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input type="time" className="w-full border rounded p-2" value={bookingTime} onChange={e => setBookingTime(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Method</label>
                  <select className="w-full border rounded p-2" value={bookingMethod} onChange={e => setBookingMethod(e.target.value as 'video' | 'chat')} required>
                    <option value="video">Video</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                  <textarea className="w-full border rounded p-2" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} rows={2} />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={bookingLoading}>{bookingLoading ? 'Booking...' : 'Book Consultation'}</Button>
                <Button type="button" className="w-full mt-2" variant="outline" onClick={() => setShowBooking(false)}>Cancel</Button>
              </form>
            </div>
          </div>
        )}
        {showFeedback && selectedConsultation && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Leave Feedback</h2>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <select className="w-full border rounded p-2" value={feedbackRating} onChange={e => setFeedbackRating(Number(e.target.value))} required>
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Comments</label>
                  <textarea className="w-full border rounded p-2" value={feedbackComments} onChange={e => setFeedbackComments(e.target.value)} rows={3} />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={feedbackLoading}>{feedbackLoading ? 'Submitting...' : 'Submit Feedback'}</Button>
                <Button type="button" className="w-full mt-2" variant="outline" onClick={() => setShowFeedback(false)}>Cancel</Button>
              </form>
            </div>
          </div>
        )}
        {showReschedule && selectedConsultation && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Reschedule Consultation</h2>
              <form onSubmit={handleRescheduleConsultation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Date</label>
                  <input type="date" className="w-full border rounded p-2" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Time</label>
                  <input type="time" className="w-full border rounded p-2" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={rescheduleLoading}>{rescheduleLoading ? 'Rescheduling...' : 'Reschedule'}</Button>
                <Button type="button" className="w-full mt-2" variant="outline" onClick={() => { setShowReschedule(false); setRescheduleDate(''); setRescheduleTime(''); }}>Cancel</Button>
              </form>
            </div>
          </div>
        )}
        {showLawyerProfile && profileLawyer && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <div className="flex flex-col items-center mb-4">
                <Image src={profileLawyer.avatarUrl} alt={profileLawyer.fullName} width={80} height={80} className="w-20 h-20 rounded-full object-cover border mb-2" />
                <h2 className="text-2xl font-bold mb-1">{profileLawyer.fullName}</h2>
                <div className="text-gray-600 mb-2">{profileLawyer.specialty.join(', ')}</div>
                <div className="text-sm text-gray-500 mb-2">Next available:</div>
                <ul className="text-sm text-gray-700 mb-2">
                  {profileLawyer.availability.map((slot, i) => (
                    <li key={i}>{new Date(slot).toLocaleString()}</li>
                  ))}
                </ul>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-2" onClick={() => { setSelectedLawyer(profileLawyer); setShowBooking(true); setShowLawyerProfile(false); }}>Book Consultation</Button>
              <Button className="w-full" variant="outline" onClick={() => setShowLawyerProfile(false)}>Close</Button>
            </div>
          </div>
        )}
      </main>
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded shadow-lg z-50 animate-fade-in">
          {toastMsg}
          <button className="ml-4 text-white font-bold" onClick={() => setShowToast(false)}>&times;</button>
        </div>
      )}
    </div>
  )
} 