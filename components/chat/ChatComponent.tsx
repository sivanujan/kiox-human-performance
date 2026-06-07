"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Search, MessageSquare, Send, User as UserIcon, Loader2, ArrowLeft, Clock, Users
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";

export default function ChatComponent() {
  const { user, profile, supabase } = useAuth();
  const pathname = usePathname();
  const isAdmin = profile?.role === "superadmin" || pathname?.includes("admin") || pathname?.startsWith("/admin");
  const isStaffView = profile?.role === "staff" || profile?.role === "medical" || pathname?.includes("staff") || pathname?.startsWith("/staff");
  
  const isCoach = profile?.role === "staff";
  const isMedical = profile?.role === "medical";
  const showThreeTabs = isAdmin || isCoach || (isStaffView && !isMedical);
  const showTwoTabs = isMedical && !isAdmin;

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'parent' | 'coach' | 'medical'>('parent');
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  const [assignedCoach, setAssignedCoach] = useState<any | null>(null);
  const [linkedChild, setLinkedChild] = useState<any | null>(null);
  const [assignedParentIds, setAssignedParentIds] = useState<string[]>([]);
  const [isRelationshipLoading, setIsRelationshipLoading] = useState(true);

  console.log("ChatComponent render - profile:", profile, "isAdmin:", isAdmin, "isStaffView:", isStaffView);

  // Set correct initial tab based on role/pathname once loaded
  useEffect(() => {
    if (showTwoTabs && activeTab === 'parent') {
      setActiveTab('coach');
    }
  }, [showTwoTabs, activeTab]);

  // Fetch relationships: assigned Coach for a Parent, assigned Parents for a Coach
  useEffect(() => {
    const fetchRelationships = async () => {
      if (!supabase || !user) return;
      setIsRelationshipLoading(true);
      try {
        console.log("[KIO-X Chat] fetchRelationships triggered - fetching fresh profile for user:", user.id);
        
        // Fetch fresh profile row using secure profile-lookup endpoint to bypass RLS
        const freshProfileRes = await fetch(`/api/user/profile-lookup?id=${user.id}`);
        const freshProfile = await freshProfileRes.json();

        if (!freshProfile || freshProfile.error) {
          console.error("[KIO-X Chat] Error fetching fresh profile:", freshProfile?.error);
          return;
        }

        console.log("[KIO-X Chat] Fresh profile resolved:", freshProfile);

        if (freshProfile.role === "parent") {
          console.log("[KIO-X Chat] Resolving parent relationship for child athlete:", freshProfile.parent_of);
          // Parent -> Athlete (freshProfile.parent_of) -> Coach (athlete.assigned_staff)
          if (freshProfile.parent_of) {
            const athleteRes = await fetch(`/api/user/profile-lookup?id=${freshProfile.parent_of}`);
            const athleteData = await athleteRes.json();

            console.log("[KIO-X Chat] Child athlete data loaded:", athleteData);

            if (athleteData && !athleteData.error) {
              setLinkedChild(athleteData);
              
              if (athleteData.assigned_staff) {
                const coachRes = await fetch(`/api/user/profile-lookup?id=${athleteData.assigned_staff}`);
                const coachData = await coachRes.json();

                console.log("[KIO-X Chat] Assigned coach data loaded:", coachData);

                if (coachData && !coachData.error) {
                  setAssignedCoach(coachData);
                }
              }
            }
          }
        } else if (freshProfile.role === "athlete") {
          console.log("[KIO-X Chat] Resolving athlete relationship for coach:", freshProfile.assigned_staff);
          if (freshProfile.assigned_staff) {
            const coachRes = await fetch(`/api/user/profile-lookup?id=${freshProfile.assigned_staff}`);
            const coachData = await coachRes.json();

            console.log("[KIO-X Chat] Assigned coach data loaded:", coachData);

            if (coachData && !coachData.error) {
              setAssignedCoach(coachData);
            }
          }
        } else if (freshProfile.role === "staff") {
          // Coach -> Athlete (athlete.assigned_staff === coach.id) -> Parent (parent.parent_of === athlete.id)
          const { data: athletes, error: athleteErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("assigned_staff", user.id)
            .eq("role", "athlete");

          if (!athleteErr && athletes && athletes.length > 0) {
            const athleteIds = athletes.map((a: any) => a.id);
            const { data: parents, error: parentsErr } = await supabase
              .from("profiles")
              .select("id")
              .eq("role", "parent")
              .in("parent_of", athleteIds);

            if (!parentsErr && parents) {
              setAssignedParentIds(parents.map((p: any) => p.id));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching relationships in ChatComponent:", err);
      } finally {
        setIsRelationshipLoading(false);
      }
    };

    fetchRelationships();
  }, [user?.id, supabase]);

  // Failsafe backup timer to ensure the loading state always unlocks
  useEffect(() => {
    if (isLoadingConversations) {
      const timer = setTimeout(() => {
        setIsLoadingConversations(false);
      }, 3000); // 3 seconds fallback
      return () => clearTimeout(timer);
    }
  }, [isLoadingConversations]);

  // Fetch all profiles belonging to the active tab's role
  useEffect(() => {
    const fetchProfilesForTab = async () => {
      if (!supabase || !user || (!isAdmin && !isStaffView)) return;
      try {
        let queryBuilder = supabase
          .from("profiles")
          .select("id, first_name, last_name, username, role, avatar_url")
          .neq("id", user.id);

        if (activeTab === "parent") {
          queryBuilder = queryBuilder.eq("role", "parent");
          
          // STRICT 1-ON-1 PRIVACY RESTRICTION FOR COACH (STAFF)
          if (profile?.role === "staff" && !isAdmin) {
            const { data: athletes } = await supabase
              .from("profiles")
              .select("id")
              .eq("assigned_staff", user.id)
              .eq("role", "athlete");
              
            const athleteIds = athletes?.map((a: any) => a.id) || [];
            if (athleteIds.length > 0) {
              queryBuilder = queryBuilder.in("parent_of", athleteIds);
            } else {
              setAllProfiles([]);
              return;
            }
          }
        } else if (activeTab === "coach") {
          queryBuilder = queryBuilder.in("role", ["staff", "superadmin"]);
        } else if (activeTab === "medical") {
          queryBuilder = queryBuilder.eq("role", "medical");
        }

        const { data, error } = await queryBuilder.order("first_name", { ascending: true });
        if (!error && data) {
          setAllProfiles(data);
        }
      } catch (err) {
        console.error("Failed to fetch profiles for tab:", err);
      }
    };

    fetchProfilesForTab();
  }, [activeTab, supabase, user?.id, isAdmin, isStaffView, profile]);

  // Clear search and reset active conversation if it doesn't belong to the active tab anymore
  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    
    if (selectedConversation && (isAdmin || isStaffView)) {
      const other = selectedConversation.participant_1 === user?.id ? selectedConversation.p2 : selectedConversation.p1;
      if (other) {
        const otherRole = other.role;
        const matchesParent = activeTab === 'parent' && otherRole === 'parent';
        const matchesCoach = activeTab === 'coach' && (otherRole === 'staff' || otherRole === 'superadmin');
        const matchesMedical = activeTab === 'medical' && otherRole === 'medical';
        if (!matchesParent && !matchesCoach && !matchesMedical) {
          setSelectedConversation(null);
          setMobileShowChat(false);
        }
      }
    }
  }, [activeTab, selectedConversation, isAdmin, isStaffView, user?.id]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const globalChannelRef = useRef<any>(null);
  
  // Web Audio Context for new message sounds
  const audioCtxRef = useRef<AudioContext | null>(null);
  const selectedConversationRef = useRef<any>(null);

  const assignedCoachRef = useRef<any>(null);
  const linkedChildRef = useRef<any>(null);
  const profileRef = useRef<any>(null);

  // Sync refs with state to prevent recreation of realtime channels
  useEffect(() => {
    assignedCoachRef.current = assignedCoach;
  }, [assignedCoach]);

  useEffect(() => {
    linkedChildRef.current = linkedChild;
  }, [linkedChild]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

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
              // Strict parent/athlete restriction in realtime message receipt
              if (profileRef.current?.role === 'parent') {
                const otherId = payload.new.participant_1 === user.id ? payload.new.participant_2 : payload.new.participant_1;
                const allowedIds = [assignedCoachRef.current?.id, linkedChildRef.current?.id].filter(Boolean);
                if (!allowedIds.includes(otherId)) {
                  return;
                }
              } else if (profileRef.current?.role === 'athlete') {
                const otherId = payload.new.participant_1 === user.id ? payload.new.participant_2 : payload.new.participant_1;
                if (!assignedCoachRef.current || otherId !== assignedCoachRef.current.id) {
                  return;
                }
              }

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
      const isGroup = conversationId === 'group_coach' || conversationId === 'group_medical';
      
      if (isGroup) {
        const groupType = conversationId === 'group_coach' ? 'coach' : 'medical';
        const { data, error } = await supabase
          .from("group_messages")
          .select(`
            id, group_type, sender_id, message, created_at,
            sender:profiles!group_messages_sender_id_fkey(id, first_name, last_name, avatar_url)
          `)
          .eq("group_type", groupType)
          .order("created_at", { ascending: true });

        if (!error && data) {
          const mapped = data.map((m: any) => ({
            id: m.id,
            conversation_id: conversationId,
            sender_id: m.sender_id,
            message: m.message,
            created_at: m.created_at,
            status: 'seen',
            sender: m.sender
          }));
          setMessages(mapped);
        } else if (error) {
          console.error("Error fetching group messages:", error);
        }
      } else {
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

    const isGroup = conversationId === 'group_coach' || conversationId === 'group_medical';

    if (isGroup) {
      const groupType = conversationId === 'group_coach' ? 'coach' : 'medical';

      const channel = supabase
        .channel(`group_messages_${groupType}_${user.id}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'group_messages',
            filter: `group_type=eq.${groupType}`
          },
          async (payload: any) => {
            let senderProfile = null;
            try {
              const res = await fetch(`/api/user/profile-lookup?id=${payload.new.sender_id}`);
              const data = await res.json();
              if (data && !data.error) {
                senderProfile = data;
              }
            } catch (err) {
              console.error("Error looking up sender profile:", err);
            }

            const messageObj = {
              id: payload.new.id,
              conversation_id: conversationId,
              sender_id: payload.new.sender_id,
              message: payload.new.message,
              created_at: payload.new.created_at,
              status: 'seen',
              sender: senderProfile
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, messageObj];
            });

            if (payload.new.sender_id !== user?.id) {
              playNotificationSound();
            }
          }
        )
        .subscribe((status) => {
          console.log(`[KIO-X Realtime] Group message subscription status for ${groupType}:`, status);
        });

      realtimeChannelRef.current = channel;
    } else {
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
            // Fetch sender details to display it beautifully using secure profile-lookup endpoint
            let senderProfile = null;
            try {
              const res = await fetch(`/api/user/profile-lookup?id=${payload.new.sender_id}`);
              const data = await res.json();
              if (data && !data.error) {
                senderProfile = data;
              }
            } catch (err) {
              console.error("Error looking up sender profile:", err);
            }

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
    }
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
        // Parents can start a chat with their Coach or their child. Athletes can ONLY start with their Coach.
        if (profile?.role === "parent") {
          const allowedIds = [assignedCoach?.id, linkedChild?.id].filter(Boolean);
          if (allowedIds.length > 0) {
            queryBuilder.in("id", allowedIds);
          } else {
            setSearchResults([]);
            setIsSearching(false);
            return;
          }
        } else if (profile?.role === "athlete") {
          if (assignedCoach) {
            queryBuilder.eq("id", assignedCoach.id);
          } else {
            setSearchResults([]);
            setIsSearching(false);
            return;
          }
        } else if (profile?.role === "staff" && activeTab === "parent" && !isAdmin) {
          // Coach (staff) under Parent Chat can ONLY search their assigned parents
          const { data: athletes } = await supabase
            .from("profiles")
            .select("id")
            .eq("assigned_staff", user.id)
            .eq("role", "athlete");
          
          const athleteIds = athletes?.map((a: any) => a.id) || [];
          if (athleteIds.length > 0) {
            queryBuilder.eq("role", "parent").in("parent_of", athleteIds);
          } else {
            setSearchResults([]);
            setIsSearching(false);
            return;
          }
        } else if (profile?.role === "superadmin") {
          // Admin Chat limits based on the sub-menu selection:
          if (activeTab === "parent") {
            queryBuilder.eq("role", "parent");
          } else if (activeTab === "coach") {
            queryBuilder.in("role", ["staff", "superadmin"]);
          } else if (activeTab === "medical") {
            queryBuilder.eq("role", "medical");
          }
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
  }, [searchQuery, user, profile?.role, supabase, activeTab, assignedCoach]);

  // Initiate or select conversation with a target user
  const handleStartChat = async (targetUser: any) => {
    if (!user || !supabase || !targetUser?.id) return;
    
    // Safety check: parents can start with coach or child. Athletes can ONLY start with coach.
    if (profile?.role === "parent") {
      const allowedIds = [assignedCoach?.id, linkedChild?.id].filter(Boolean);
      if (!allowedIds.includes(targetUser.id)) {
        console.warn("[KIO-X Chat] Parent attempt to message unauthorized user blocked.");
        return;
      }
    } else if (profile?.role === "athlete") {
      if (!assignedCoach || targetUser.id !== assignedCoach.id) {
        console.warn("[KIO-X Chat] Athlete attempt to message non-coach blocked.");
        return;
      }
    }

    try {
      console.log("[KIO-X Chat] Starting chat with target user:", targetUser);
      
      // Fetch all conversations for the active user - simpler, robust query
      const { data: convs, error: fetchError } = await supabase
        .from("conversations")
        .select("id, participant_1, participant_2")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

      if (fetchError) {
        console.error("[KIO-X Chat] Fetch conversations error:", fetchError);
        throw fetchError;
      }

      const existingConv = convs?.find(c => 
        (c.participant_1 === user.id && c.participant_2 === targetUser.id) ||
        (c.participant_1 === targetUser.id && c.participant_2 === user.id)
      );

      if (existingConv) {
        console.log("[KIO-X Chat] Found existing conversation:", existingConv);
        // Load existing thread
        const matched = conversations.find(c => c.id === existingConv.id);
        if (matched) {
          setSelectedConversation(matched);
        } else {
          await fetchConversations();
          // Find again in updated list, or build a fallback
          const updatedMatched = conversations.find(c => c.id === existingConv.id);
          if (updatedMatched) {
            setSelectedConversation(updatedMatched);
          } else {
            setSelectedConversation({ 
              id: existingConv.id, 
              participant_1: existingConv.participant_1, 
              participant_2: existingConv.participant_2,
              p1: existingConv.participant_1 === user.id ? profile || user : targetUser, 
              p2: existingConv.participant_2 === user.id ? profile || user : targetUser 
            });
          }
        }
        setMobileShowChat(true);
        setSearchQuery("");
      } else {
        console.log("[KIO-X Chat] No existing conversation. Creating new...");
        // Create new direct message thread
        const p1 = user.id < targetUser.id ? user.id : targetUser.id;
        const p2 = user.id < targetUser.id ? targetUser.id : user.id;

        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({ participant_1: p1, participant_2: p2, updated_at: new Date().toISOString() })
          .select()
          .single();

        if (createError) {
          console.error("[KIO-X Chat] Create conversation error:", createError);
          throw createError;
        }

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
    } catch (err: any) {
      console.error("[KIO-X Chat] Failed to start chat thread detailed error:", {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        errorObject: err
      });
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

      const isGroup = selectedConversation.id === 'group_coach' || selectedConversation.id === 'group_medical';

      if (isGroup) {
        const groupType = selectedConversation.id === 'group_coach' ? 'coach' : 'medical';
        
        // 2. Perform insert to public.group_messages
        const { data, error } = await supabase
          .from("group_messages")
          .insert({
            group_type: groupType,
            sender_id: user.id,
            message: messageText
          })
          .select()
          .single();

        if (error) throw error;

        // Replace optimistic message with server database record
        if (data) {
          setMessages((prev) => 
            prev.map((m) => (m.id === tempId ? {
              id: data.id,
              conversation_id: selectedConversation.id,
              sender_id: data.sender_id,
              message: data.message,
              created_at: data.created_at,
              status: 'seen',
              sender: optimisticMessage.sender
            } : m))
          );
        }
      } else {
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
      }
    } catch (err) {
      console.error("Message transmission failure:", err);
    }
  };

  const getOtherParticipant = (conv: any) => {
    if (!conv || !user) return null;
    return conv.participant_1 === user.id ? conv.p2 : conv.p1;
  };

  const otherParticipant = getOtherParticipant(selectedConversation);
  const isGroup = selectedConversation?.id === 'group_coach' || selectedConversation?.id === 'group_medical';
  const activeConversationName = isGroup
    ? (selectedConversation.id === 'group_coach' ? 'COACH TACTICAL GROUP' : 'MEDICAL OFFICERS GROUP')
    : (otherParticipant 
        ? `${otherParticipant.first_name || ""} ${otherParticipant.last_name || ""}`.trim() || "Agent"
        : "Chat Thread");

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

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    if (!other) return false;

    if (profile?.role === 'parent') {
      const allowedIds = [assignedCoach?.id, linkedChild?.id].filter(Boolean);
      return allowedIds.includes(other.id);
    }
    if (profile?.role === 'athlete') {
      return assignedCoach ? other.id === assignedCoach.id : false;
    }

    if (!isAdmin && !isStaffView) return true;
    
    if (activeTab === 'parent') {
      if (profile?.role === 'staff' && !isAdmin) {
        // Enforce coach can only see assigned parents
        return other.role === 'parent' && assignedParentIds.includes(other.id);
      }
      return other.role === 'parent';
    }
    if (activeTab === 'coach') {
      return other.role === 'staff' || other.role === 'superadmin';
    }
    if (activeTab === 'medical') {
      return other.role === 'medical';
    }
    return true;
  });

  const hasActiveCoachConv = conversations.some(conv => {
    const other = getOtherParticipant(conv);
    return other?.id === assignedCoach?.id;
  });

  const getConversationForProfile = (profileId: string) => {
    return conversations.find((conv) => {
      const other = getOtherParticipant(conv);
      return other?.id === profileId;
    });
  };

  // Auto-select or start chat with assigned coach for parent/athlete
  useEffect(() => {
    if ((profile?.role === 'parent' || profile?.role === 'athlete') && assignedCoach && !selectedConversation && !isLoadingConversations) {
      const coachConv = conversations.find(conv => {
        const other = getOtherParticipant(conv);
        return other?.id === assignedCoach.id;
      });
      if (coachConv) {
        setSelectedConversation(coachConv);
        setMobileShowChat(true);
      } else {
        handleStartChat(assignedCoach);
      }
    }
  }, [profile, assignedCoach, conversations, selectedConversation, isLoadingConversations]);

  const sortedProfiles = [...allProfiles].sort((a, b) => {
    const convA = getConversationForProfile(a.id);
    const convB = getConversationForProfile(b.id);
    
    if (convA && convB) {
      const timeA = convA.updated_at ? new Date(convA.updated_at).getTime() : 0;
      const timeB = convB.updated_at ? new Date(convB.updated_at).getTime() : 0;
      if (!isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
    }
    if (convA) return -1;
    if (convB) return 1;
    
    const nameA = `${a.first_name || ""} ${a.last_name || ""}`.trim().toLowerCase() || a.username?.toLowerCase() || "";
    const nameB = `${b.first_name || ""} ${b.last_name || ""}`.trim().toLowerCase() || b.username?.toLowerCase() || "";
    return nameA.localeCompare(nameB);
  });

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
        w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] bg-[#0c0c0c] border-r border-white/5 
        flex flex-col shrink-0 h-full z-30
        ${mobileShowChat ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Sidebar Header & Search */}
        <div className="p-6 border-b border-white/5 space-y-4 relative">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-[#22c55e]" size={20} />
            <h2 className="font-display text-xl text-white uppercase tracking-wider">
              {profile?.role === 'parent' || profile?.role === 'athlete' ? 'Coach Uplink' : 'Tactical Uplinks'}
            </h2>
          </div>

          {/* Search box to start new chat */}
          {profile?.role !== 'parent' && profile?.role !== 'athlete' && (
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents by name or role..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/50 focus:bg-black/60 transition-all font-sans"
              />
            </div>
          )}

          {/* Submenu Tabs for Admins & Performance Coaches */}
          {showThreeTabs && (
            <div className="flex overflow-x-auto flex-nowrap scrollbar-none bg-black/40 border border-white/5 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('parent')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all min-w-max px-3 ${
                  activeTab === 'parent'
                    ? "bg-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                Parent Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('coach')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all min-w-max px-3 ${
                  activeTab === 'coach'
                    ? "bg-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                Coach Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('medical')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all min-w-max px-3 ${
                  activeTab === 'medical'
                    ? "bg-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                Medical Chat
              </button>
            </div>
          )}

          {/* Submenu Tabs for Medical Staff */}
          {showTwoTabs && (
            <div className="flex overflow-x-auto flex-nowrap scrollbar-none bg-black/40 border border-white/5 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('coach')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all min-w-max px-3 ${
                  activeTab === 'coach'
                    ? "bg-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                Coach Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('medical')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all min-w-max px-3 ${
                  activeTab === 'medical'
                    ? "bg-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                Medical Chat
              </button>
            </div>
          )}

          {/* User Search Dropdown Overlay */}
          {searchQuery.trim() && (
            <div className="absolute top-full left-6 right-6 bg-[#0a0a0a] border border-[#22c55e]/20 rounded-2xl p-4 shadow-2xl z-40 max-h-[300px] overflow-y-auto custom-scrollbar mt-2">
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
                        <p className="text-[8px] font-black text-[#22c55e]/70 uppercase tracking-[1.5px] mt-0.5">{targetUser.role === 'superadmin' ? 'System Admin' : targetUser.role === 'staff' ? 'Coach' : targetUser.role === 'medical' ? 'Medical' : targetUser.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation Thread List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative z-10">
          {isLoadingConversations ? (
            <div className="h-full flex items-center justify-center flex-col gap-2 font-label text-[10px] text-gray-500 tracking-[2px] uppercase">
              <Loader2 className="animate-spin text-[#22c55e]" size={24} /> Syncing uplinks...
            </div>
          ) : (
            <>
              {/* Group Chat Uplinks for Coaches & Medical Staff */}
              {((activeTab === 'coach' && (profile?.role === 'staff' || profile?.role === 'superadmin')) ||
                (activeTab === 'medical' && (profile?.role === 'medical' || profile?.role === 'superadmin'))) && (
                <div className="mb-4 space-y-2 pb-4 border-b border-white/5">
                  <div className="text-[8px] font-black text-[#22c55e]/60 tracking-[2px] uppercase px-2 mb-2">SYSTEM GROUP TERMINALS</div>
                  
                  {/* Coach Group Chat (Visible to coaches and superadmins) */}
                  {activeTab === 'coach' && (profile?.role === 'staff' || profile?.role === 'superadmin') && (
                    <button
                      onClick={() => {
                        setSelectedConversation({
                          id: 'group_coach',
                          isGroup: true,
                          groupType: 'coach',
                          name: 'COACH TACTICAL GROUP',
                          role: 'group'
                        });
                        setMobileShowChat(true);
                      }}
                      className={`w-full p-4 rounded-2xl border flex items-center gap-3 text-left transition-all relative overflow-hidden group/item ${
                        selectedConversation?.id === 'group_coach'
                          ? "bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                          : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                          selectedConversation?.id === 'group_coach' ? 'bg-[#22c55e]/20 border-[#22c55e]' : 'bg-white/5 border-white/10 group-hover/item:border-white/20'
                        }`}>
                          <Users className="text-[#22c55e]" size={20} />
                        </div>
                        <span className="online-dot" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className={`text-xs font-bold uppercase truncate ${selectedConversation?.id === 'group_coach' ? "text-[#22c55e]" : "text-white"}`}>COACH TACTICAL GROUP</p>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-[10px] text-gray-500 font-medium truncate flex-1">
                            Secure shared command uplink
                          </p>
                          <span className="px-2 py-0.5 h-5 flex items-center justify-center bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[7.5px] font-black uppercase tracking-widest rounded shrink-0 min-w-[65px]">
                            COACHES
                          </span>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Medical Group Chat (Visible to medical staff and superadmins) */}
                  {activeTab === 'medical' && (profile?.role === 'medical' || profile?.role === 'superadmin') && (
                    <button
                      onClick={() => {
                        setSelectedConversation({
                          id: 'group_medical',
                          isGroup: true,
                          groupType: 'medical',
                          name: 'MEDICAL OFFICERS GROUP',
                          role: 'group'
                        });
                        setMobileShowChat(true);
                      }}
                      className={`w-full p-4 rounded-2xl border flex items-center gap-3 text-left transition-all relative overflow-hidden group/item ${
                        selectedConversation?.id === 'group_medical'
                          ? "bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                          : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                          selectedConversation?.id === 'group_medical' ? 'bg-[#22c55e]/20 border-[#22c55e]' : 'bg-white/5 border-white/10 group-hover/item:border-white/20'
                        }`}>
                          <Users className="text-[#22c55e]" size={20} />
                        </div>
                        <span className="online-dot" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className={`text-xs font-bold uppercase truncate ${selectedConversation?.id === 'group_medical' ? "text-[#22c55e]" : "text-white"}`}>MEDICAL OFFICERS GROUP</p>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-[10px] text-gray-500 font-medium truncate flex-1">
                            Secure medical staff uplink
                          </p>
                          <span className="px-2 py-0.5 h-5 flex items-center justify-center bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[7.5px] font-black uppercase tracking-widest rounded shrink-0 min-w-[65px]">
                            MEDICAL
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {(isAdmin || isStaffView) ? (
            // Admin and Staff list all profiles of the selected role category
            sortedProfiles.length === 0 ? (
              ((activeTab === 'coach' && (profile?.role === 'staff' || profile?.role === 'superadmin')) ||
               (activeTab === 'medical' && (profile?.role === 'medical' || profile?.role === 'superadmin'))) ? null : (
                <div className="h-full flex items-center justify-center flex-col gap-4 text-center px-6 py-12">
                  <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-gray-500">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">No active signals</p>
                    <p className="text-[9px] text-gray-600 uppercase font-bold tracking-[1px] mt-1">
                      {profile?.role === "staff" && activeTab === "parent" 
                        ? "No parents of assigned athletes found." 
                        : "No registry entries found for this category."}
                    </p>
                  </div>
                </div>
              )
            ) : (
              sortedProfiles.map((p) => {
                const conv = getConversationForProfile(p.id);
                const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username || "Agent";
                const formattedRole = p.role === 'superadmin' ? 'Admin' : p.role === 'staff' ? 'Coach' : p.role === 'medical' ? 'Medical' : p.role;
                
                if (conv) {
                  // Existing conversation card layout
                  const isSelected = selectedConversation?.id === conv.id;
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
                          ? "bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.15)]" 
                          : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={p.avatar_url} name={name} size="md" className={isSelected ? "border-[#22c55e]" : ""} />
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
                } else {
                  // Idle profile card layout (tap to start chat)
                  const isSelected = selectedConversation && 
                    (selectedConversation.participant_1 === p.id || selectedConversation.participant_2 === p.id);

                  return (
                    <button
                      key={`profile-${p.id}`}
                      onClick={() => handleStartChat(p)}
                      className={`w-full p-4 rounded-2xl border flex items-center gap-3 text-left transition-all relative overflow-hidden group/item ${
                        isSelected 
                          ? "bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.15)]" 
                          : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={p.avatar_url} name={name} size="md" className={isSelected ? "border-[#22c55e]" : ""} />
                        <span className="w-2.5 h-2.5 bg-gray-600 rounded-full absolute bottom-[-1px] right-[-1px] border-2 border-[#0c0c0c]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className={`text-xs font-bold uppercase truncate ${isSelected ? "text-[#22c55e]" : "text-white"}`}>{name}</p>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-[10px] text-gray-600 font-medium truncate flex-1 italic">
                            Tap to start chat
                          </p>
                          <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[1px] shrink-0">
                            {formattedRole}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                }
              })
            )
          ) : (
            // Non-admin lists active conversations normally
            profile?.role === 'parent' ? (
              isRelationshipLoading ? (
                <div className="h-full flex items-center justify-center flex-col gap-2 font-label text-[10px] text-gray-500 tracking-[2px] uppercase">
                  <Loader2 className="animate-spin text-[#22c55e]" size={24} /> Syncing uplinks...
                </div>
              ) : !assignedCoach && !linkedChild ? (
                <div className="h-full flex items-center justify-center flex-col gap-4 text-center px-6">
                  <div className="w-12 h-12 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-2xl flex items-center justify-center text-[#ef4444]">
                    <Clock size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#ef4444] uppercase tracking-[2px]">Uplink Offline</p>
                    <p className="text-[9px] text-gray-600 uppercase font-bold tracking-[1px] mt-1">
                      No linked coach or athlete profile resolved.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Active Conversations */}
                  {filteredConversations.map((conv) => {
                    const other = getOtherParticipant(conv);
                    if (!other) return null;
                    
                    const isSelected = selectedConversation?.id === conv.id;
                    const name = `${other.first_name || ""} ${other.last_name || ""}`.trim() || other.username || "Agent";
                    const formattedRole = other.role === 'superadmin' ? 'Admin' : other.role === 'staff' ? 'Coach' : other.role === 'medical' ? 'Medical' : other.role === 'athlete' ? 'Child' : other.role;
                    
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
                            ? "bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.15)]" 
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
                  })}

                  {/* Idle Coach (if no conversation exists yet) */}
                  {assignedCoach && !conversations.some(c => getOtherParticipant(c)?.id === assignedCoach.id) && (
                    <button
                      key={`coach-${assignedCoach.id}`}
                      onClick={() => handleStartChat(assignedCoach)}
                      className="w-full p-4 rounded-2xl border flex items-center gap-3 text-left transition-all relative overflow-hidden group/item bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                    >
                      <div className="relative shrink-0">
                        <Avatar src={assignedCoach.avatar_url} name={`${assignedCoach.first_name || ""} ${assignedCoach.last_name || ""}`.trim() || assignedCoach.username} size="md" />
                        <span className="w-2.5 h-2.5 bg-gray-600 rounded-full absolute bottom-[-1px] right-[-1px] border-2 border-[#0c0c0c]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className="text-xs font-bold uppercase truncate text-white">
                            {`${assignedCoach.first_name || ""} ${assignedCoach.last_name || ""}`.trim() || assignedCoach.username || "Coach"}
                          </p>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-[10px] text-gray-600 font-medium truncate flex-1 italic">
                            Tap to start secure chat
                          </p>
                          <p className="text-[8px] text-[#22c55e] font-bold uppercase tracking-[1px] shrink-0">
                            Coach
                          </p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Idle Child Athlete (if no conversation exists yet) */}
                  {linkedChild && !conversations.some(c => getOtherParticipant(c)?.id === linkedChild.id) && (
                    <button
                      key={`child-${linkedChild.id}`}
                      onClick={() => handleStartChat(linkedChild)}
                      className="w-full p-4 rounded-2xl border flex items-center gap-3 text-left transition-all relative overflow-hidden group/item bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                    >
                      <div className="relative shrink-0">
                        <Avatar src={linkedChild.avatar_url} name={`${linkedChild.first_name || ""} ${linkedChild.last_name || ""}`.trim() || linkedChild.username} size="md" />
                        <span className="w-2.5 h-2.5 bg-gray-600 rounded-full absolute bottom-[-1px] right-[-1px] border-2 border-[#0c0c0c]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className="text-xs font-bold uppercase truncate text-white">
                            {`${linkedChild.first_name || ""} ${linkedChild.last_name || ""}`.trim() || linkedChild.username || "Child"}
                          </p>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-[10px] text-gray-600 font-medium truncate flex-1 italic">
                            Tap to start secure chat
                          </p>
                          <p className="text-[8px] text-[#22c55e] font-bold uppercase tracking-[1px] shrink-0">
                            Child
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )
            ) : filteredConversations.length === 0 ? (
              <div className="h-full flex items-center justify-center flex-col gap-4 text-center px-6">
                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-gray-500">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">No active uplinks</p>
                  <p className="text-[9px] text-gray-600 uppercase font-bold tracking-[1px] mt-1">
                    Search for a coach or staff member above to start chatting.
                  </p>
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                if (!other) return null;
                
                const isSelected = selectedConversation?.id === conv.id;
                const name = `${other.first_name || ""} ${other.last_name || ""}`.trim() || other.username || "Agent";
                const formattedRole = other.role === 'superadmin' ? 'Admin' : other.role === 'staff' ? 'Coach' : other.role === 'medical' ? 'Medical' : other.role;
                
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
                        ? "bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.15)]" 
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
            )
          )}
          </>
        )}
        </div>
      </aside>

      {/* RIGHT SIDEBAR: ACTIVE CHAT SCREEN */}
      <main className={`
        flex-1 bg-[#0b0f1e]/30 flex flex-col h-full z-20 min-w-0
        ${mobileShowChat ? 'flex' : 'hidden md:flex'}
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
                      Secure Uplink Active // {isGroup ? 'Tactical Group Chat' : (otherParticipant?.role === 'superadmin' ? 'Admin' : otherParticipant?.role === 'staff' ? 'Coach' : otherParticipant?.role)}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative z-10 bg-black/10">
              {isLoadingMessages ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 font-label text-[10px] text-gray-500 uppercase tracking-[2px] bg-black/5 z-20">
                  <Loader2 className="animate-spin text-[#22c55e] mb-1" size={24} /> Syncing transcripts...
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
            <form onSubmit={handleSendMessage} className="p-4 md:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-6 bg-[#0c0c0c] border-t border-white/5 flex gap-3 shrink-0 z-10 relative">
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
