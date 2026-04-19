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

    const channelId = `alerts_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "athlete_alerts" },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Resolve a single alert — isolated from global loading state so it never gets stuck
  const resolveAlert = async (alertId: string, resolverId?: string) => {
    try {
      const updatePayload: any = {
        is_resolved: true,
        resolved_at: new Date().toISOString(),
      };
      // Only set resolved_by if we have a valid user ID to avoid NOT NULL violations
      if (resolverId) {
        updatePayload.resolved_by = resolverId;
      }

      const { error } = await supabase
        .from("athlete_alerts")
        .update(updatePayload)
        .eq("id", alertId);

      if (error) throw error;

      // Optimistically remove from local state immediately — no waiting for realtime
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      return { success: true };
    } catch (err: any) {
      console.error("Failed to resolve anomaly:", err);
      return { success: false, error: err.message };
    }
  };

  // 4. Resolve ALL active alerts at once (bulk clear)
  const resolveAllAlerts = async (resolverId?: string) => {
    try {
      // First, handle any MEDICAL_CLEARANCE_REQUEST alerts specially
      // by calling the clearance-approve API so injuries are also cleared
      const clearanceAlerts = alerts.filter(a => a.alert_type === 'MEDICAL_CLEARANCE_REQUEST');
      for (const ca of clearanceAlerts) {
        try {
          await fetch(`/api/admin/athlete/${ca.athlete_id}/injury/clearance-approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alertId: ca.id })
          });
        } catch (e) {
          console.error(`Could not auto-approve clearance for ${ca.athlete_id}:`, e);
        }
      }

      // Now bulk-resolve all remaining alerts
      const updatePayload: any = {
        is_resolved: true,
        resolved_at: new Date().toISOString(),
      };
      if (resolverId) {
        updatePayload.resolved_by = resolverId;
      }

      const { error } = await supabase
        .from("athlete_alerts")
        .update(updatePayload)
        .eq("is_resolved", false);

      if (error) throw error;

      // Clear local state immediately
      setAlerts([]);
      return { success: true };
    } catch (err: any) {
      console.error("Failed to resolve all anomalies:", err);
      return { success: false, error: err.message };
    }
  };

  // 5. Fetch Resolved History
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

  return { alerts, loading, resolveAlert, resolveAllAlerts, fetchAlerts, getResolvedHistory };
}
