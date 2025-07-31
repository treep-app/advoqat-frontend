"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scale, CheckCircle, Clock, UserCheck } from "lucide-react";

export default function FreelancerOnboardingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="flex flex-col items-center">
          <Scale className="h-12 w-12 text-blue-600 mb-2" />
          <CardTitle className="text-2xl font-bold text-blue-700 text-center">Welcome to advoqat, Lawyer!</CardTitle>
          <CardDescription className="text-center mt-2">
            Thank you for registering as a freelance lawyer.<br/>
            Your profile is under review. Here’s what happens next:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4 my-6">
            <li className="flex items-center gap-3">
              <UserCheck className="text-blue-600 w-6 h-6" />
              <span>Your credentials and documents are being reviewed by our team.</span>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="text-blue-600 w-6 h-6" />
              <span>Verification may take up to 24 hours. We’ll notify you by email once approved.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="text-green-600 w-6 h-6" />
              <span>Once approved, you’ll gain access to your lawyer dashboard and start accepting cases.</span>
            </li>
          </ul>
          <div className="text-center mt-8">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/freelancer/dashboard")}>Go to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 