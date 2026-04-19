import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function useAlerts() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch active alerts
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("athlete_alerts")
        .select(`
          *,
          athlete:profiles!athlete_id(id, first_name, last_name)
        `)
        .eq("is_resolved", false)
        .order("triggered_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error("Alert Matrix Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Real-time Subscription
  useEffect(() => {
    fetchAlerts();

    // Subscribe to new alerts and resolution updates
    const channelId = `alerts_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "athlete_alerts" },
        () => {
          fetchAlerts(); // Refresh list on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Resolve Alert Action
  const resolveAlert = async (alertId: string, resolverId?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("athlete_alerts")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolverId
        })
        .eq("id", alertId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Failed to resolve anomaly:", err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 4. Fetch Resolved History
  const getResolvedHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("athlete_alerts")
        .select(`
          *,
          athlete:profiles!athlete_id(id, first_name, last_name),
          resolver:profiles!resolved_by(id, first_name, last_name)
        `)
        .eq("is_resolved", true)
        .order("resolved_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("History Matrix Sync Error:", err);
      return [];
    }
  };

  return { alerts, loading, resolveAlert, fetchAlerts, getResolvedHistory };
}
