"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Search, MessageSquare, Send, User as UserIcon, Loader2, ArrowLeft, Clock
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";

export default function ChatComponent() {
  const { user, profile, supabase } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  
  // Mobile UI state: false = show conversation list, true = show chat window
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const globalChannelRef = useRef<any>(null);
  
  // Web Audio Context for new message sounds
  const audioCtxRef = useRef<AudioContext | null>(null);
  const selectedConversationRef = useRef<any>(null);

  // Sync ref with selected conversation
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Audio tone generator using Web Audio API
  const playNotificationSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5)
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15); // 150ms duration with fade out

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (err) {
      console.warn("Audio Context playback blocked/failed:", err);
    }
  };

  // Mark all unread incoming messages in a conversation as seen
  const markMessagesAsSeen = async (conversationId: string) => {
    if (!supabase || !user) return;
    try {
      await supabase
        .from("messages")
        .update({ status: 'seen' })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .neq("status", "seen");
    } catch (err) {
      console.warn("Failed to mark messages as seen:", err);
    }
  };

  // Mark all unread incoming messages in all conversations as delivered on mount/load
  const markAllIncomingAsDelivered = async () => {
    if (!supabase || !user) return;
    try {
      await supabase
        .from("messages")
        .update({ status: 'delivered' })
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .neq("sender_id", user.id)
        .eq("status", "sent");
    } catch (err) {
      console.warn("Failed to mark all incoming as delivered:", err);
    }
  };

  // Initial load and global real-time setup
  useEffect(() => {
    if (user && supabase) {
      markAllIncomingAsDelivered();
      fetchConversations();
      
      // Global message listener to play sound and trigger updates for other chats
      const globalChannel = supabase
        .channel(`global_messages_watcher_${user.id}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages'
          },
          async (payload: any) => {
            // Check if user is a participant in this conversation
            if (payload.new.participant_1 === user.id || payload.new.participant_2 === user.id) {
              fetchConversations();
              
              // If it is a new message from someone else
              if (payload.new.sender_id !== user.id) {
                const isActiveConv = payload.new.conversation_id === selectedConversationRef.current?.id;
                
                // Instantly transition status to seen (if active chat is open) or delivered (if chat is not active)
                try {
                  await supabase
                    .from("messages")
                    .update({ status: isActiveConv ? 'seen' : 'delivered' })
                    .eq("id", payload.new.id);
                } catch (statusErr) {
                  console.warn("Failed to automatically update message status:", statusErr);
                }

                // Only play notification sound if the conversation is NOT currently open
                if (!isActiveConv) {
                  playNotificationSound();
                }
              }
            }
          }
        )
        .subscribe();

      globalChannelRef.current = globalChannel;

      // Setup conversations list realtime watcher
      const conversationChannel = supabase
        .channel(`conversations_watcher_${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'conversations' },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(globalChannel);
        supabase.removeChannel(conversationChannel);
      };
    }
  }, [user, supabase]);

  // Handle active conversation changes to load messages and set up realtime channels
  useEffect(() => {
    if (selectedConversation && supabase) {
      fetchMessages(selectedConversation.id);
      setupRealtimeMessages(selectedConversation.id);
      markMessagesAsSeen(selectedConversation.id);
    } else {
      setMessages([]);
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    }

    return () => {
      if (realtimeChannelRef.current && supabase) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [selectedConversation?.id, supabase, user?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id, participant_1, participant_2, updated_at,
          p1:profiles!conversations_participant_1_fkey(id, first_name, last_name, avatar_url, role),
          p2:profiles!conversations_participant_2_fkey(id, first_name, last_name, avatar_url, role)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("fetchConversations DB Query Error:", error);
      } else if (data) {
        // Fetch last message for each conversation in parallel
        const conversationsWithLastMessage = await Promise.all(
          data.map(async (conv: any) => {
            const { data: msgData } = await supabase
              .from("messages")
              .select("message, created_at, sender_id, status")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            return {
              ...conv,
              last_message: msgData || null
            };
          })
        );
        setConversations(conversationsWithLastMessage);
      }
    } catch (err) {
      console.error("fetchConversations Unhandled Exception:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!supabase) return;
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id, conversation_id, sender_id, message, created_at, status,
          sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const setupRealtimeMessages = (conversationId: string) => {
    if (!supabase || !user) return;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    // Subscribe to new inserts and status updates in messages using server-side filtering
    // Unique channel names per user prevent socket connection conflicts in multi-tab sessions
    const channel = supabase
      .channel(`chat_messages_${conversationId}_${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload: any) => {
          // Fetch sender details to display it beautifully
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const messageObj = {
            ...payload.new,
            sender: senderProfile
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, messageObj];
          });

          // Trigger notification sound for incoming message
          if (payload.new.sender_id !== user?.id) {
            playNotificationSound();
            markMessagesAsSeen(conversationId);
          }
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: any) => {
          // Update message status in list
          setMessages((prev) => 
            prev.map((m) => m.id === payload.new.id ? { ...m, status: payload.new.status } : m)
          );
        }
      )
      .subscribe((status) => {
        console.log(`[KIO-X Realtime] Message subscription status for ${conversationId}:`, status);
      });

    realtimeChannelRef.current = channel;
  };

  // Perform a user search based on roles
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !supabase || !user) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const queryBuilder = supabase
          .from("profiles")
          .select("id, first_name, last_name, username, role, avatar_url")
          .neq("id", user.id);

        // Apply string search filter
        queryBuilder.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);

        // Context-aware limits:
        // Athletes and Parents can ONLY start a chat with Coach, Staff, or Medical
        if (profile?.role === "athlete" || profile?.role === "parent") {
          queryBuilder.in("role", ["staff", "superadmin", "medical"]);
        }

        const { data, error } = await queryBuilder.limit(10);
        if (!error && data) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user, profile?.role, supabase]);

  // Initiate or select conversation with a target user
  const handleStartChat = async (targetUser: any) => {
    if (!user || !supabase) return;
    try {
      // Check if thread exists
      const { data: existingConv, error: fetchError } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${targetUser.id}),and(participant_1.eq.${targetUser.id},participant_2.eq.${user.id})`)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingConv) {
        // Load existing thread
        const matched = conversations.find(c => c.id === existingConv.id);
        if (matched) {
          setSelectedConversation(matched);
        } else {
          await fetchConversations();
          setSelectedConversation({ id: existingConv.id, p1: user, p2: targetUser });
        }
        setMobileShowChat(true);
        setSearchQuery("");
      } else {
        // Create new direct message thread
        const p1 = user.id < targetUser.id ? user.id : targetUser.id;
        const p2 = user.id < targetUser.id ? targetUser.id : user.id;

        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({ participant_1: p1, participant_2: p2, updated_at: new Date().toISOString() })
          .select()
          .single();

        if (createError) throw createError;

        if (newConv) {
          await fetchConversations();
          setSelectedConversation({
            id: newConv.id,
            participant_1: p1,
            participant_2: p2,
            p1: user.id === p1 ? profile || user : targetUser,
            p2: user.id === p2 ? profile || user : targetUser
          });
          setMobileShowChat(true);
          setSearchQuery("");
        }
      }
    } catch (err) {
      console.error("Failed to start chat thread:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user || !supabase) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      // 1. Optimistically append message to local messages state immediately
      const tempId = `optimistic-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        message: messageText,
        created_at: new Date().toISOString(),
        status: 'sent',
        sender: {
          id: user.id,
          first_name: profile?.first_name || "Me",
          last_name: profile?.last_name || "",
          avatar_url: profile?.avatar_url || null
        }
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      scrollToBottom();

      // 2. Perform insert to public.messages
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          message: messageText,
          status: 'sent'
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with server database record
      if (data) {
        setMessages((prev) => 
          prev.map((m) => (m.id === tempId ? { ...data, sender: optimisticMessage.sender } : m))
        );
      }

      // 3. Touch the conversation thread updated_at to bubble it to the top
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);

      // 4. Send system notification to the recipient (fallback client-side system alert)
      const otherUser = selectedConversation.participant_1 === user.id 
        ? selectedConversation.p2 
        : selectedConversation.p1;
      const recipientId = otherUser?.id;

      if (recipientId) {
        const senderName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.username || "Someone";
        
        await supabase
          .from("system_notifications")
          .insert({
            recipient_id: recipientId,
            sender_id: user.id,
            title: 'NEW CHAT MESSAGE',
            message: `${senderName}: ${messageText}`,
            type: 'MESSAGE'
          });
      }

      fetchConversations();
    } catch (err) {
      console.error("Message transmission failure:", err);
    }
  };

  const getOtherParticipant = (conv: any) => {
    if (!conv || !user) return null;
    return conv.participant_1 === user.id ? conv.p2 : conv.p1;
  };

  const otherParticipant = getOtherParticipant(selectedConversation);
  const activeConversationName = otherParticipant 
    ? `${otherParticipant.first_name || ""} ${otherParticipant.last_name || ""}`.trim() || "Agent"
    : "Chat Thread";

  // WhatsApp-style outgoing message read ticks
  const renderTicks = (status: 'sent' | 'delivered' | 'seen') => {
    if (status === 'seen') {
      return <span className="text-[#22c55e] ml-1 text-[11px] font-bold select-none">✓✓</span>;
    }
    if (status === 'delivered') {
      return <span className="text-gray-500 ml-1 text-[11px] font-bold select-none">✓✓</span>;
    }
    // Default 'sent' or null
    return <span className="text-gray-500 ml-1 text-[11px] font-bold select-none">✓</span>;
  };

  return (
    <div className="h-[calc(100vh-140px)] bg-[#0a0e1a] border border-[#22c55e]/20 rounded-[24px] overflow-hidden flex relative shadow-2xl">
      {/* Cyberpunk Green Grid Decorative Background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Embedded premium CSS Styles for online indicators and mobile responsive animations */}
      <style>{`
        .online-dot {
          width: 10px;
          height: 10px;
          background-color: #22c55e;
          border-radius: 50%;
          position: absolute;
          bottom: -1px;
          right: -1px;
          border: 2px solid #0c0c0c;
          box-shadow: 0 0 10px #22c55e;
          animation: pulse-ring-indicator 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-ring-indicator {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 8px #22c55e;
          }
          50% {
            opacity: 0.6;
            transform: scale(0.8);
            box-shadow: 0 0 4px #22c55e;
          }
        }
        
        @media (max-width: 768px) {
          .mobile-hide {
            display: none !important;
          }
        }
      `}</style>

      {/* LEFT SIDEBAR: CONVERSATION LIST */}
      <aside className={`
        absolute md:static inset-y-0 left-0 w-full md:w-[360px] lg:w-[400px] bg-[#0c0c0c] border-r border-white/5 
        flex flex-col z-30 transition-transform duration-300 ease-in-out
        ${mobileShowChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        {/* Sidebar Header & Search */}
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-[#22c55e]" size={20} />
            <h2 className="font-display text-xl text-white uppercase tracking-wider">Tactical Uplinks</h2>
          </div>

          {/* Search box to start new chat */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents by name or role..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22c55e]/30 focus:bg-black/60 transition-all font-sans"
            />
          </div>
        </div>

        {/* User Search Dropdown Overlay */}
        {searchQuery.trim() && (
          <div className="absolute top-[135px] left-6 right-6 bg-[#0a0a0a] border border-[#22c55e]/20 rounded-2xl p-4 shadow-2xl z-40 max-h-[300px] overflow-y-auto custom-scrollbar">
            <div className="text-[8px] font-black text-[#22c55e] tracking-[2px] uppercase mb-3">Lookup Results</div>
            {isSearching ? (
              <div className="py-6 flex items-center justify-center gap-2 font-label text-[10px] text-gray-500">
                <Loader2 className="animate-spin text-[#22c55e]" size={14} /> Resolving signal...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-6 text-center font-label text-[10px] text-gray-600 uppercase tracking-widest">
                No active signals found
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((targetUser) => (
                  <button
                    key={targetUser.id}
                    onClick={() => handleStartChat(targetUser)}
                    className="w-full bg-white/[0.01] hover:bg-[#22c55e]/10 hover:border-[#22c55e]/20 border border-white/5 rounded-xl p-3 flex items-center gap-3 text-left transition-all"
                  >
                    <div className="relative">
                      <Avatar src={targetUser.avatar_url} name={targetUser.first_name || targetUser.username} size="sm" />
                      <span className="online-dot" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase">{targetUser.first_name} {targetUser.last_name}</p>
                      <p className="text-[8px] font-black text-[#22c55e]/70 uppercase tracking-[1.5px] mt-0.5">{targetUser.role === 'superadmin' ? 'System Admin' : targetUser.role === 'staff' ? 'Coach' : targetUser.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversation Thread List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative z-10">
          {isLoadingConversations ? (
            <div className="h-full flex items-center justify-center flex-col gap-2 font-label text-[10px] text-gray-500 tracking-[2px] uppercase">
              <Loader2 className="animate-spin text-[#22c55e]" size={24} /> Syncing uplinks...
            </div>
          ) : conversations.length === 0 ? (
            <div className="h-full flex items-center justify-center flex-col gap-4 text-center px-6">
              <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-gray-500">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">No active uplinks</p>
                <p className="text-[9px] text-gray-600 uppercase font-bold tracking-[1px] mt-1">Search for a coach or staff member above to start chatting.</p>
              </div>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              if (!other) return null;
              
              const isSelected = selectedConversation?.id === conv.id;
              const name = `${other.first_name || ""} ${other.last_name || ""}`.trim() || other.username || "Agent";
              const formattedRole = other.role === 'superadmin' ? 'Admin' : other.role === 'staff' ? 'Coach' : other.role;
              
              const lastMsgText = conv.last_message ? conv.last_message.message : 'No messages yet';
              const lastMsgTime = conv.last_message 
                ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : '';

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setMobileShowChat(true);
                  }}
                  className={`w-full p-4 rounded-2xl border flex items-center gap-3 text-left transition-all relative overflow-hidden group/item ${
                    isSelected 
                      ? "bg-[#22c55e]/10 border-[#22c55e]/30 shadow-[0_0_15px_rgba(34,197,94,0.08)]" 
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={other.avatar_url} name={name} size="md" className={isSelected ? "border-[#22c55e]" : ""} />
                    <span className="online-dot" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className={`text-xs font-bold uppercase truncate ${isSelected ? "text-[#22c55e]" : "text-white"}`}>{name}</p>
                      {lastMsgTime && (
                        <span className="text-[8.5px] font-black text-gray-500 uppercase tracking-widest shrink-0 ml-2">
                          {lastMsgTime}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-[10px] text-gray-500 font-medium truncate flex-1">
                        {lastMsgText}
                      </p>
                      <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[1px] shrink-0">
                        {formattedRole}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT SIDEBAR: ACTIVE CHAT SCREEN */}
      <main className={`
        flex-1 bg-[#0b0f1e]/30 flex flex-col z-20 h-full absolute md:static inset-0 transition-transform duration-300 ease-in-out
        ${mobileShowChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {selectedConversation ? (
          <>
            {/* Chat Screen Header */}
            <header className="p-4 md:p-6 bg-[#0c0c0c] border-b border-white/5 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                {/* Back Button for Mobile view navigation */}
                <button 
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-2.5 bg-white/5 border border-white/10 rounded-xl text-[#22c55e] active-scale transition-all mr-1"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="relative">
                  <Avatar src={otherParticipant?.avatar_url} name={activeConversationName} size="md" className="border-[#22c55e]/30" />
                  <span className="online-dot" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">{activeConversationName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[1.5px]">
                      Secure Uplink Active // {otherParticipant?.role === 'superadmin' ? 'Admin' : otherParticipant?.role === 'staff' ? 'Coach' : otherParticipant?.role}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative z-10 bg-black/10">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center flex-col gap-2 font-label text-[10px] text-gray-500 uppercase tracking-[2px]">
                  <Loader2 className="animate-spin text-[#22c55e]" size={20} /> Syncing transcripts...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col gap-3 text-center opacity-30 select-none">
                  <div className="w-10 h-10 border border-white/20 rounded-xl flex items-center justify-center text-gray-400">
                    <Clock size={16} />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[3px]">Secure terminal initiated. Begin chat.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  const senderName = m.sender 
                    ? `${m.sender.first_name || ""} ${m.sender.last_name || ""}`.trim() 
                    : "Unknown User";
                  const messageStatus = m.status || 'sent';

                  return (
                    <div 
                      key={m.id}
                      className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      {!isMe && (
                        <Avatar src={m.sender?.avatar_url} name={senderName} size="sm" className="mt-1" />
                      )}
                      <div>
                        {/* Sender Label for incoming messages */}
                        {!isMe && (
                          <span className="text-[7.5px] font-black text-[#22c55e] uppercase tracking-widest mb-1.5 block">
                            {senderName}
                          </span>
                        )}
                        <div className={`p-4 rounded-2xl text-xs font-sans leading-relaxed border transition-all ${
                          isMe 
                            ? "bg-[#163523] text-white border-[#22c55e]/30 rounded-tr-none shadow-[0_4px_15px_rgba(34,197,94,0.08)]" 
                            : "bg-[#1d222d] text-gray-200 border-white/5 rounded-tl-none"
                        }`}>
                          <p className="whitespace-pre-wrap">{m.message}</p>
                          
                          {/* Timestamp and ticks on outgoing messages */}
                          <div className="text-[7.5px] text-gray-500 font-bold uppercase tracking-widest text-right mt-2 flex items-center justify-end gap-1 select-none">
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && renderTicks(messageStatus)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Submission Box */}
            <form onSubmit={handleSendMessage} className="p-4 md:p-6 bg-[#0c0c0c] border-t border-white/5 flex gap-3 shrink-0 z-10 relative">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22c55e]/30 focus:bg-black/60 transition-all font-sans"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#22c55e] text-black px-6 rounded-xl hover:bg-white hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-[#22c55e] disabled:hover:text-black transition-all flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)] active-scale shrink-0"
              >
                <Send size={14} className="md:mr-2" />
                <span className="text-[9px] font-black uppercase tracking-[2px] hidden md:inline">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0e1a]/20 relative z-10 select-none">
            <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-center text-gray-600 mb-6 shadow-2xl">
              <MessageSquare size={28} />
            </div>
            <h3 className="font-display text-lg text-white uppercase tracking-wider mb-2">Comms Terminal Idle</h3>
            <p className="text-xs text-gray-500 font-sans max-w-sm">Select an uplink from the list on the left or search for a coach or staff member to initiate a direct message thread.</p>
          </div>
        )}
      </main>
    </div>
  );
}
