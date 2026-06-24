"use client";

import CurriculumTimeline from "@/components/curriculum/CurriculumTimeline";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminCurriculumPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && profile.role !== "superadmin") {
      router.push("/admin");
    }
  }, [profile, loading, router]);

  // Only block on auth loading — once auth resolves, render the timeline
  // (The timeline has its own data loading state)
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#22c55e]/20 border-t-[#22c55e] animate-spin" />
      </div>
    );
  }

  if (!profile || profile.role !== "superadmin") return null;

  return <CurriculumTimeline />;
}
