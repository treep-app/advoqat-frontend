"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { logger } from '@/lib/utils'

export default function DashboardRoleRedirect() {
  const router = useRouter();
  const BASE_URL = process.env.BASE_URL || 'https://legaliq.onrender.com';
  
  useEffect(() => {
    async function checkRoleAndRedirect() {
      if (typeof window === "undefined") return;
      if (!window.location.pathname.startsWith("/dashboard") && !window.location.pathname.startsWith("/freelancer/dashboard")) return;
      
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;
      logger.log('Supabase user data:', data.user);
      
      // Try to get userId from localStorage first
      let userId = localStorage.getItem("userId");
      logger.log('userId from localStorage:', userId);
      
      // Validate userId from localStorage by checking if it exists in the database
      if (userId) {
        try {
          const validateRes = await fetch(`${BASE_URL}/api/users/role?userId=${userId}`);
          if (!validateRes.ok) {
            logger.log('Invalid userId in localStorage, clearing it');
            localStorage.removeItem("userId");
            userId = null;
          }
        } catch (error) {
          logger.error('Error validating userId:', error);
          localStorage.removeItem("userId");
          userId = null;
        }
      }
      
      // If no userId in localStorage, try to get it from the backend using supabase_id
      if (!userId) {
        try {
          logger.log('Fetching user by supabase_id:', data.user.id);
          const userRes = await fetch(`${BASE_URL}/api/users/by-supabase-id?supabaseId=${data.user.id}`);
          logger.log('User response status:', userRes.status);
          
          if (userRes.ok) {
            const userData = await userRes.json();
            logger.log('User data from backend:', userData);
            userId = userData.id;
            // Store the userId in localStorage for future use
            localStorage.setItem("userId", String(userId));
          } else if (userRes.status === 404) {
            // User doesn't exist in database yet, try to sync them
            logger.log('User not found in database, attempting to sync...');
            try {
              const syncData = {
                supabaseId: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.full_name || ''
              };
              logger.log('Syncing user with data:', syncData);
              
              const syncRes = await fetch(`${BASE_URL}/api/users/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(syncData)
              });
              
              logger.log('Sync response status:', syncRes.status);
              
              if (syncRes.ok) {
                const syncedUser = await syncRes.json();
                userId = syncedUser.id;
                localStorage.setItem("userId", String(userId));
                logger.log('User synced successfully:', syncedUser);
              } else {
                const errorText = await syncRes.text();
                logger.error('Failed to sync user:', errorText);
                return;
              }
            } catch (syncError) {
              logger.error('Error syncing user:', syncError);
              return;
            }
          }
        } catch (error) {
          logger.error('Error fetching user by supabase ID:', error);
          return;
        }
      }
      
      if (!userId) {
        logger.log('No userId found, skipping role check');
        return;
      }
      
      logger.log('userId', userId);
      
      try {
        const res = await fetch(`${BASE_URL}/api/users/role?userId=${userId}`);
        logger.log('response role', res);
        
        if (!res.ok) {
          logger.error('Failed to fetch user role:', res.status, res.statusText);
          return;
        }
        
        const { role } = await res.json();
        logger.log('role------', role);
        
        if (role === "freelancer" && !window.location.pathname.startsWith("/freelancer/dashboard")) {
          router.replace("/freelancer/dashboard");
        } else if (role === "user" && !window.location.pathname.startsWith("/dashboard")) {
          router.replace("/dashboard");
        }
      } catch (error) {
        logger.error('Error checking user role:', error);
      }
    }
    
    checkRoleAndRedirect();
  }, [router, BASE_URL]);
  
  return null;
} 