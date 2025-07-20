"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scale } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5001";

const EXPERTISE_OPTIONS = [
  "Consumer Law",
  "Tenancy Law",
  "Corporate Law",
  "Family Law",
  "Criminal Law",
  "Employment Law",
  "Intellectual Property",
  "Immigration Law",
  "Other"
];

const ONBOARDING_STEPS = [
  "Account Info",
  "Credentials",
  "Expertise",
  "NDA",
  "Review & Submit"
];

export default function FreelancerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    experience: "",
    expertiseAreas: [] as string[],
    idCard: null as File|null,
    barCertificate: null as File|null,
    additionalDocuments: [] as File[],
    ndaAccepted: false
  });
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"form"|"success">("form");
  const [currentStep, setCurrentStep] = useState(0);

  // File input refs
  const idCardRef = useRef<HTMLInputElement>(null);
  const barCertRef = useRef<HTMLInputElement>(null);
  const addDocsRef = useRef<HTMLInputElement>(null);

  // 1. Handle form changes
  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm(f => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }
  function handleExpertiseChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setForm(f => ({ ...f, expertiseAreas: selected }));
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, files } = e.target;
    if (!files) return;
    if (name === "idCard") setForm(f => ({ ...f, idCard: files[0] }));
    if (name === "barCertificate") setForm(f => ({ ...f, barCertificate: files[0] }));
    if (name === "additionalDocuments") setForm(f => ({ ...f, additionalDocuments: Array.from(files) }));
  }

  function nextStep() {
    setCurrentStep((s) => Math.min(s + 1, ONBOARDING_STEPS.length - 1));
  }
  function prevStep() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  // 2. Handle form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // Step-by-step validation
    if (currentStep === 0) {
      if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
        setError("Please fill in all required fields.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setError("");
      nextStep();
      return;
    }
    if (currentStep === 1) {
      if (!form.idCard) {
        setError("Please upload your ID Card.");
        return;
      }
      if (!form.barCertificate) {
        setError("Please upload your Bar Certificate.");
        return;
      }
      setError("");
      nextStep();
      return;
    }
    if (currentStep === 2) {
      if (!form.experience || form.expertiseAreas.length === 0) {
        setError("Please provide your experience and select at least one area of expertise.");
        return;
      }
      setError("");
      nextStep();
      return;
    }
    if (currentStep === 3) {
      if (!form.ndaAccepted) {
        setError("You must accept the NDA and platform guidelines.");
        return;
      }
      setError("");
      nextStep();
      return;
    }
    // Final step: submit all
    setLoading(true);
    setUploading(true);
    // 3. Register user in Supabase
    if (process.env.NEXT_PUBLIC_DISABLE_EMAILS === "true") {
      setLoading(false);
      setUploading(false);
      setError("Email sending is disabled in this environment. Registration is not available.");
      return;
    }
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          phone: form.phone
        }
      }
    });
    if (signUpError || !data.user) {
      setLoading(false);
      setUploading(false);
      setError(signUpError?.message || "Failed to sign up. Please try again.");
      return;
    }
    // 4. Sync user to backend
    const syncRes = await fetch(`${BASE_URL}/api/users/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabaseId: data.user.id,
        email: form.email,
        name: form.name
      })
    });
    if (!syncRes.ok) {
      setLoading(false);
      setUploading(false);
      let syncErr;
      const data = await syncRes.json();
      try {
        syncErr = await syncRes.json();
      } catch {
        syncErr = {};
      }
      if (syncRes.status === 409 && syncErr.error) {
      
        console.log(`Registration failed: ${data.error}`);
        setError(syncErr.error);
      } else if (syncErr.error) {
        setError(syncErr.error);
      } else {
        setError(data.error || "Registration failed. Please try again.");
        // setError(`Failed to sync user. [${syncRes.status}] Please try again.`);
      }
      return;
    }
    const userRow = await syncRes.json();
    // Save userId and info to localStorage for dashboard use
    if (typeof window !== "undefined") {
      localStorage.setItem("userId", String(userRow.id));
      localStorage.setItem("userEmail", userRow.email);
      localStorage.setItem("userName", userRow.name);
    }
    // 5. Upload files (simulate, or use your preferred storage)
    // For demo, we'll just use fake URLs
    // In production, upload to S3, Supabase Storage, etc.
    const idCardUrl = form.idCard ? `/uploads/${form.idCard.name}` : "";
    const barCertificateUrl = form.barCertificate ? `/uploads/${form.barCertificate.name}` : "";
    const additionalDocuments = form.additionalDocuments.map(f => `/uploads/${f.name}`);
    setUploading(false);
    // 6. Register freelancer
    const regRes = await fetch(`${BASE_URL}/api/freelancers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        experience: Number(form.experience),
        expertiseAreas: form.expertiseAreas,
        idCardUrl,
        barCertificateUrl,
        additionalDocuments,
        userId: userRow.id
      })
    });
    setLoading(false);
    if (regRes.ok) {
      setError("Registration submitted! Please check your email for verification and await approval by our team.");
      setStep("success");
      setTimeout(() => router.push("/freelancer/onboarding"), 3000);
    } else {
      const data = await regRes.json();
      console.log(`Registration failed: ${data.error}`);
      setError(data.error || "Registration failed. Please try again.");
    }
  }

  // Stepper UI
  function Stepper() {
    return (
      <div className="flex justify-between items-center mb-8">
        {ONBOARDING_STEPS.map((step, idx) => (
          <div key={step} className="flex-1 flex flex-col items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white ${idx <= currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}>{idx + 1}</div>
            <div className={`text-xs mt-2 text-center ${idx === currentStep ? 'text-blue-700 font-semibold' : 'text-gray-500'}`}>{step}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="flex flex-col items-center">
          <Scale className="h-12 w-12 text-blue-600 mb-2" />
          <CardTitle className="text-2xl font-bold text-blue-700">Register as a Lawyer</CardTitle>
          <CardDescription className="text-center">Join LegaliQ and start accepting legal cases online.</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" && (
            <>
              <Stepper />
              {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {currentStep === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Full Name</label>
                      <Input name="name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Email</label>
                      <Input name="email" type="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Phone</label>
                      <Input name="phone" value={form.phone} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Years of Experience</label>
                      <Input name="experience" type="number" min={0} value={form.experience} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Password</label>
                      <Input name="password" type="password" value={form.password} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Confirm Password</label>
                      <Input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
                    </div>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Upload ID Card <span className="text-red-500">*</span></label>
                      <Input
                        name="idCard"
                        type="file"
                        accept="image/*,application/pdf"
                        ref={idCardRef}
                        onChange={handleFileChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Upload Bar Certificate <span className="text-red-500">*</span></label>
                      <Input
                        name="barCertificate"
                        type="file"
                        accept="image/*,application/pdf"
                        ref={barCertRef}
                        onChange={handleFileChange}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium">Upload Additional Documents (optional)</label>
                      <Input
                        name="additionalDocuments"
                        type="file"
                        accept="image/*,application/pdf"
                        ref={addDocsRef}
                        onChange={handleFileChange}
                        multiple
                      />
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Areas of Legal Expertise</label>
                    <select
                      name="expertiseAreas"
                      multiple
                      value={form.expertiseAreas}
                      onChange={handleExpertiseChange}
                      className="w-full border rounded p-2"
                      required
                    >
                      {EXPERTISE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <small className="text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</small>
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="ndaAccepted"
                      checked={form.ndaAccepted}
                      onChange={handleChange}
                      required
                    />
                    <span className="text-sm">I agree to the <a href="/nda" className="underline text-blue-600" target="_blank">NDA</a> and platform guidelines.</span>
                  </div>
                )}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-blue-700">Review Your Information</div>
                    <div><b>Name:</b> {form.name}</div>
                    <div><b>Email:</b> {form.email}</div>
                    <div><b>Phone:</b> {form.phone}</div>
                    <div><b>Experience:</b> {form.experience} years</div>
                    <div><b>Expertise:</b> {form.expertiseAreas.join(", ")}</div>
                    <div><b>ID Card:</b> {form.idCard ? form.idCard.name : ""}</div>
                    <div><b>Bar Certificate:</b> {form.barCertificate ? form.barCertificate.name : ""}</div>
                    <div><b>Additional Documents:</b> {form.additionalDocuments.map(f => f.name).join(", ") || "None"}</div>
                    <div><b>NDA Accepted:</b> {form.ndaAccepted ? "Yes" : "No"}</div>
                  </div>
                )}
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>Back</Button>
                  <Button type={currentStep === ONBOARDING_STEPS.length - 1 ? "submit" : "button"} className="bg-blue-600 hover:bg-blue-700" onClick={currentStep < ONBOARDING_STEPS.length - 1 ? nextStep : undefined} disabled={loading || uploading}>
                    {currentStep === ONBOARDING_STEPS.length - 1 ? (loading ? "Registering..." : "Register as Lawyer") : "Next"}
                  </Button>
                </div>
              </form>
            </>
          )}
          {step === "success" && (
            <div className="text-center py-12">
              <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-bounce" />
              <div className="text-2xl font-bold text-blue-700 mb-2">Registration Submitted!</div>
              <div className="text-gray-700 mb-4">Please check your email for verification and await approval by our team.</div>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/")}>Back to Home</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 