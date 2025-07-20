"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Scale, User, Clock, LogOut, Menu, ChevronLeft, DollarSign, Circle, MessageCircle, FileText, Star, Settings, CheckCircle, Plus, RefreshCw, Search } from "lucide-react";

const BASE_URL = process.env.BASE_URL || "http://localhost:5001";

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-orange-100 text-orange-700",
  Low: "bg-green-100 text-green-700"
};

type Case = {
  id: number;
  priority?: string;
  title: string;
  client?: string;
  client_name?: string;
  status: string;
  deadline?: string;
  submitted?: string;
};

export default function FreelancerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [availability, setAvailability] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // API-driven state
  const [quickStats, setQuickStats] = useState({ earnings: 0, pendingReviews: 0, activeCases: 0 });
  const [cases, setCases] = useState<Case[]>([]);

  // Get userId from localStorage (set after user sync/login)
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  console.log("userId", userId);

  async function handleToggleAvailability() {
    if (!userId) {
      setNotification({ type: "error", message: "User not found." });
      return;
    }
    setAvailabilityLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/freelancers/availability/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !availability })
      });
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.is_available);
        setNotification({ type: "success", message: `Availability set to ${data.is_available ? "Available" : "Offline"}` });
      } else {
        setNotification({ type: "error", message: "Failed to update availability." });
      }
    } catch {
      setNotification({ type: "error", message: "Failed to update availability." });
    } finally {
      setAvailabilityLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        // Quick stats: earnings, pending reviews, active cases
        const earningsRes = await fetch(`${BASE_URL}/api/freelancers/earnings/${userId}`);
        const earningsData = earningsRes.ok ? await earningsRes.json() : { totalEarnings: 0 };
        // const ratingsRes = await fetch(`${BASE_URL}/api/freelancers/ratings/${userId}`);
        // const ratingsData = ratingsRes.ok ? await ratingsRes.json() : { performanceScore: 0 };
        const casesRes = await fetch(`${BASE_URL}/api/freelancers/cases/${userId}`);
        const casesData = casesRes.ok ? await casesRes.json() : [];
        // For demo, treat pending = status 'pending', active = status 'accepted' or 'active'
        const pending = casesData.filter((c: Case) => c.status === 'pending');
        const active = casesData.filter((c: Case) => c.status === 'accepted' || c.status === 'active');
        setQuickStats({
          earnings: earningsData.totalEarnings || 0,
          pendingReviews: pending.length,
          activeCases: active.length
        });
        setCases(casesData);
        // Messages, documents, feedback: placeholder for now
        // setMessages([]); // Replace with real API call
        // setDocuments([]); // Replace with real API call
        // setFeedback([]); // Replace with real API call
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar (responsive) */}
      <aside className={`fixed z-40 md:static md:translate-x-0 top-0 left-0 h-full w-64 bg-white border-r flex flex-col py-6 px-4 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center gap-2 mb-8">
          <Scale className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">LegaliQ</span>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start font-semibold text-blue-700"><HomeIcon /> Home</Button>
          <Button variant="ghost" className="w-full justify-start flex items-center"><Clock className="h-5 w-5 mr-2" /> Case Inbox</Button>
          <Button variant="ghost" className="w-full justify-start flex items-center"><MessageCircle className="h-5 w-5 mr-2" /> Chat</Button>
          <Button variant="ghost" className="w-full justify-start flex items-center"><FileText className="h-5 w-5 mr-2" /> Document Annotator</Button>
          <Button variant="ghost" className="w-full justify-start flex items-center"><User className="h-5 w-5 mr-2" /> Profile & Credentials</Button>
          <Button variant="ghost" className="w-full justify-start flex items-center"><DollarSign className="h-5 w-5 mr-2" /> Payments</Button>
          <Button variant="ghost" className="w-full justify-start flex items-center"><Star className="h-5 w-5 mr-2" /> Ratings & Feedback</Button>
          <Button variant="ghost" className="w-full justify-start flex items-center"><Settings className="h-5 w-5 mr-2" /> Settings</Button>
        </nav>
        <div className="mt-8 flex items-center gap-2">
          <User className="h-5 w-5 text-gray-600" />
          <span className="text-sm text-gray-700">Jane Smith</span>
          <Button variant="outline" size="sm" className="ml-auto"> <LogOut className="h-4 w-4 mr-1" /> Sign Out</Button>
        </div>
      </aside>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${notification.type === "success" ? "bg-green-600" : "bg-red-600"}`}>{notification.message}</div>
      )}
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white border-b px-4 md:px-8 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-blue-600" />
            </Button>
            <div className="text-2xl font-bold text-blue-700">Home</div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon"><Search className="h-5 w-5 text-gray-500" /></Button>
            <Button variant="ghost" size="icon"><Plus className="h-5 w-5 text-blue-600" /></Button>
            <Button variant="ghost" size="icon"><RefreshCw className="h-5 w-5 text-gray-500" /></Button>
            <Button variant={availability ? "outline" : "default"} size="sm" className={availability ? "text-green-700 border-green-200 bg-green-50" : "bg-gray-200 text-gray-600"} onClick={handleToggleAvailability} disabled={availabilityLoading}>
              <Circle className={`h-4 w-4 mr-1 ${availability ? "text-green-500" : "text-gray-400"}`} />
              {availabilityLoading ? "Updating..." : availability ? "Available" : "Offline"}
            </Button>
            <div className="relative">
              <Button variant="ghost" onClick={() => setShowNotifications(v => !v)} className="relative">
                <Bell className="h-6 w-6 text-blue-600" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
              </Button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white border rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b font-semibold text-blue-700 flex items-center gap-2">
                    <Bell className="h-5 w-5" /> Notifications (2)
                  </div>
                  <ul className="divide-y">
                    <li className="p-4 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">High</span>
                        <span className="font-semibold">New Case: Review Lease Agreement</span>
                        <span className="ml-auto text-xs text-gray-500">2h ago</span>
                      </div>
                      <div className="text-xs text-gray-600">Client: John Doe</div>
                    </li>
                    <li className="p-4 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">Medium</span>
                        <span className="font-semibold">Message from Acme Corp</span>
                        <span className="ml-auto text-xs text-gray-500">3h ago</span>
                      </div>
                      <div className="text-xs text-gray-600">&quot;Can we schedule a call?&quot;</div>
                    </li>
                  </ul>
                  <div className="p-2 text-center border-t">
                    <Button variant="link" className="text-blue-700">View All Notifications →</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading dashboard...</div>
          ) : (
            <>
              {error && (
                <div className="text-center text-red-600 py-4">{error}</div>
              )}
              {/* Quick Stats */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="flex flex-col justify-between">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" /> Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{error ? "$0" : `$${quickStats.earnings}`}</div>
                  </CardContent>
                </Card>
                <Card className="flex flex-col justify-between">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-orange-600" /> Pending Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{error ? "-" : quickStats.pendingReviews}</div>
                  </CardContent>
                </Card>
                <Card className="flex flex-col justify-between">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-blue-600" /> Active Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{error ? "-" : quickStats.activeCases}</div>
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
                    <CardDescription>Available and assigned cases</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Priority</th>
                          <th className="px-4 py-2 text-left">Case Title</th>
                          <th className="px-4 py-2 text-left">Client</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Deadline</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {error ? (
                          <tr><td colSpan={6} className="text-center text-gray-400 py-8">No cases to display.</td></tr>
                        ) : cases.length === 0 ? (
                          <tr><td colSpan={6} className="text-center text-gray-400 py-8">No cases to display.</td></tr>
                        ) : cases.map((c: Case) => (
                          <tr key={c.id} className="border-b">
                            <td><span className={`px-2 py-1 rounded-full text-xs font-bold ${PRIORITY_COLORS[c.priority as keyof typeof PRIORITY_COLORS] || ''}`}>{c.priority || '—'}</span></td>
                            <td>{c.title}</td>
                            <td>{c.client || c.client_name || '—'}</td>
                            <td>{c.status}</td>
                            <td>{c.deadline || '—'}</td>
                            <td className="flex flex-col md:flex-row gap-2">
                              {c.status === "pending" && <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Accept</Button>}
                              {c.status === "pending" && <Button size="sm" variant="outline">Decline</Button>}
                              {c.status === "accepted" || c.status === "active" ? <Button size="sm" className="bg-blue-600 hover:bg-blue-700">View</Button> : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </section>
              {/* Chat Preview */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-600" /> Recent Messages
                    </CardTitle>
                    <CardDescription>Latest client communications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-400 text-center py-8">No messages yet.</div>
                  </CardContent>
                </Card>
                {/* Document Annotator Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" /> Recent Documents
                    </CardTitle>
                    <CardDescription>Quick access to annotate/review</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-400 text-center py-8">No documents yet.</div>
                  </CardContent>
                </Card>
              </section>
              {/* Ratings & Feedback */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" /> Ratings & Feedback
                    </CardTitle>
                    <CardDescription>Latest client reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-400 text-center py-8">No feedback yet.</div>
                  </CardContent>
                </Card>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Home icon for sidebar
function HomeIcon() {
  return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline h-5 w-5 mr-2 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 2v6m0 0h4m-4 0a2 2 0 01-2-2v-4m6 6v-6m0 0l2 2m-2-2l-2 2" /></svg>;
} 