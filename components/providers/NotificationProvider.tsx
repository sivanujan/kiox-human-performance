"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, supabase } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Register Service Worker for PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(
        (registration) => {
          console.log("PWA Service Worker registered successfully:", registration.scope);
        },
        (err) => {
          console.warn("PWA Service Worker registration failed:", err);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setUserId(null);
      return;
    }
    
    setUserId(user.id);

    // Request Browser Permissions
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          console.log("Notification permission:", permission);
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (!userId) return;

    // Listen to Supabase Realtime for the system_notifications table
    const channel = supabase
      .channel("system_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "system_notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log("New Notification Received:", payload.new);
          const newNotif = payload.new;

          // Only trigger if user is not currently inside the chat window
          const isOnChatPage = typeof window !== "undefined" && window.location.pathname.endsWith("/chat");
          
          // Trigger Web Push Notification
          if (!isOnChatPage && "Notification" in window && Notification.permission === "granted") {
            try {
              // Create native notification popup
              const notifPopup = new Notification(newNotif.title, {
                body: newNotif.message,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                requireInteraction: false
              });

              // Click callback to focus the tab and redirect to the chat system
              notifPopup.onclick = () => {
                window.focus();
                notifPopup.close();

                if (newNotif.type === 'MESSAGE') {
                  const role = profile?.role;
                  let chatPath = "/dashboard/chat";
                  if (role === "superadmin") {
                    chatPath = "/admin/chat";
                  } else if (role === "staff" || role === "medical") {
                    chatPath = "/staff/chat";
                  }
                  window.location.href = chatPath; // Redirect the active tab to the chat terminal
                }
              };
            } catch (err) {
              console.error("Failed to show push notification:", err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, profile?.role]);

  return <>{children}</>;
}
