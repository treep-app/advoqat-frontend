"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardRoleRedirect() {
  const router = useRouter();
  const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
  useEffect(() => {
    async function checkRoleAndRedirect() {
      if (typeof window === "undefined") return;
      if (!window.location.pathname.startsWith("/dashboard") && !window.location.pathname.startsWith("/freelancer/dashboard")) return;
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      console.log('userId', userId)
      const res = await fetch(`${BASE_URL}/api/users/role?userId=${userId}`);
      console.log('response role', res)
      if (!res.ok) return;
      const { role } = await res.json();
      console.log('role------', role)
      if (role === "freelancer" && !window.location.pathname.startsWith("/freelancer/dashboard")) {
        router.replace("/freelancer/dashboard");
      } else if (role === "user" && !window.location.pathname.startsWith("/dashboard")) {
        router.replace("/dashboard");
      }
    }
    checkRoleAndRedirect();
  }, [router, BASE_URL]);
  return null;
} 