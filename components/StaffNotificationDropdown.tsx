"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, Loader2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "./providers/AuthProvider";
import SessionDetailsModal from "./modals/SessionDetailsModal";

export default function StaffNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const { user } = useAuth();
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Subscribe to realtime updates for staff_notifications
    const channel = supabase
      .channel("staff_notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "staff_notifications",
          filter: `staff_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

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
    try {
      const res = await fetch('/api/staff/notifications');
      const data = await res.json();
      if (!data.error) setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await fetch('/api/staff/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id, isRead: true })
    });
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from("staff_notifications").delete().eq("id", id);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-xl bg-white/5 border flex items-center justify-center transition-all ${
          isOpen ? 'border-[#22c55e] text-[#22c55e]' : 'border-white/10 text-white/40 hover:text-[#22c55e] hover:border-[#22c55e]/30'
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
        <div className="absolute top-full right-0 mt-4 w-80 sm:w-96 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden backdrop-blur-3xl">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
            <h3 className="text-white text-[11px] font-black uppercase tracking-widest">Operational Alerts</h3>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center text-[#22c55e]"><Loader2 className="animate-spin" /></div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[10px] font-bold uppercase tracking-widest italic">
                No alerts detected.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-white/5 relative group transition-colors hover:bg-white/5 ${notif.is_read ? 'opacity-60' : 'bg-[#22c55e]/5'}`}
                >
                  <div 
                    className="flex gap-3 cursor-pointer"
                    onClick={async () => {
                      if (notif.type === 'PROGRAM_ASSIGNED') {
                        window.location.href = '/staff#assigned-architectures';
                        setIsOpen(false);
                      } else if (notif.type === 'EMERGENCY_SESSION' && notif.related_id) {
                        const { data } = await supabase
                          .from("training_sessions")
                          .select("*, coach:profiles!coach_id(first_name, last_name)")
                          .eq("id", notif.related_id)
                          .single();
                        if (data) {
                          setSelectedSession(data);
                          setIsOpen(false);
                        }
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {!notif.is_read ? <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" /> : <div className="w-2 h-2 rounded-full bg-white/10" />}
                    </div>
                    <div className="flex-1 pr-8">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`text-[11px] font-black uppercase tracking-widest ${!notif.is_read ? 'text-amber-500' : 'text-white/70'}`}>
                          {notif.type.replace(/_/g, ' ')}
                        </h4>
                        <span className="text-[8px] text-gray-400 font-bold uppercase">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button onClick={(e) => markAsRead(notif.id, e)} className="p-1.5 rounded-md bg-white/5 text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-colors">
                        <Check size={12} strokeWidth={3} />
                      </button>
                    )}
                    <button onClick={(e) => deleteNotification(notif.id, e)} className="p-1.5 rounded-md bg-white/5 text-white/40 hover:bg-red-500 hover:text-white transition-colors">
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {selectedSession && (
        <SessionDetailsModal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
        />
      )}
    </div>
  );
}
