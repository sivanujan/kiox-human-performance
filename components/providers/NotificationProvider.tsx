"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initNotifications = async () => {
      // 1. Get current authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      setUserId(session.user.id);

      // 2. Request Browser Permissions
      if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            console.log("Notification permission:", permission);
          });
        }
      }
    };

    initNotifications();
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    // 3. Listen to Supabase Realtime for the system_notifications table
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

          // 4. Trigger Web Push Notification
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              // Create native notification popup
              new Notification(newNotif.title, {
                body: newNotif.message,
                icon: "/favicon.ico", // Tweak this later to a KIO-X logo if available
                badge: "/favicon.ico",
                requireInteraction: false
              });

              // Optional: Play a sound
              // const audio = new Audio('/notification-ping.mp3');
              // audio.play().catch(e => console.log('Audio blocked', e));
              
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
  }, [userId, supabase]);

  return <>{children}</>;
}
