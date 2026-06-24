"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, Loader2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "./providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Tech-sounding soft double-ping
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio playback blocked by browser policy without user interaction.', e);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel("system_notifications_dropdown")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev]);
            playNotificationSound();
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("system_notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (!error && data) setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from("system_notifications").update({ is_read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from("system_notifications").update({ is_read: true }).eq("recipient_id", user?.id).eq("is_read", false);
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from("system_notifications").delete().eq("id", id);
  };

  const handleNotificationClick = async (notif: any) => {
    // Mark as read in state & DB if not already read
    if (!notif.is_read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      await supabase.from("system_notifications").update({ is_read: true }).eq("id", notif.id);
    }
    
    // Close dropdown
    setIsOpen(false);

    // Redirect to chat if it's a chat notification
    if (notif.type === 'MESSAGE') {
      const role = profile?.role;
      let chatPath = "/dashboard/chat";
      if (role === "superadmin") {
        chatPath = "/admin/chat";
      } else if (role === "staff" || role === "medical") {
        chatPath = "/staff/chat";
      }
      router.push(chatPath);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-xl bg-bg-input border flex items-center justify-center transition-all ${
          isOpen ? 'border-accent-green text-accent-green' : 'border-border-input text-text-muted hover:text-accent-green hover:border-accent-green/30'
        }`}
      >
         <Bell size={18} />
         {unreadCount > 0 && (
           <div className="absolute top-2.5 right-2.5 flex items-center justify-center w-2 h-2">
             <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-75"></span>
             <div className="relative w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444]" />
           </div>
         )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-4 w-80 sm:w-96 bg-bg-card border border-border-card rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl">
          {/* Header */}
          <div className="p-4 border-b border-border-card flex justify-between items-center bg-bg-secondary/40">
            <h3 className="text-text-primary text-[11px] font-black uppercase tracking-widest">System Alerts</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-accent-green hover:text-text-primary transition-colors text-[9px] font-bold uppercase tracking-wider">
                Mark All Read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center text-accent-green"><Loader2 className="animate-spin" /></div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-[10px] font-bold uppercase tracking-widest italic">
                No alerts detected.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-border-card relative group transition-colors hover:bg-bg-card-hover cursor-pointer ${notif.is_read ? 'opacity-60' : 'bg-accent-green/5'}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {!notif.is_read ? <div className="w-2 h-2 rounded-full bg-accent-green shadow-[0_0_8px_var(--accent-green)]" /> : <div className="w-2 h-2 rounded-full bg-text-muted/20" />}
                    </div>
                    <div className="flex-1 pr-8">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`text-[11px] font-black uppercase tracking-widest ${!notif.is_read ? 'text-accent-green' : 'text-text-primary/70'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[8px] text-text-muted font-bold uppercase">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions Overlay */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button onClick={(e) => markAsRead(notif.id, e)} className="p-1.5 rounded-md bg-bg-input text-accent-green hover:bg-accent-green hover:text-text-on-green transition-colors" title="Mark as read">
                        <Check size={12} strokeWidth={3} />
                      </button>
                    )}
                    <button onClick={(e) => deleteNotification(notif.id, e)} className="p-1.5 rounded-md bg-bg-input text-text-muted hover:bg-red-500 hover:text-white transition-colors" title="Delete">
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
