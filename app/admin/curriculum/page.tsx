"use client";

import CurriculumTimeline from "@/components/curriculum/CurriculumTimeline";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminCurriculumPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && profile.role !== "superadmin") {
      router.push("/admin");
    }
  }, [profile, loading, router]);

  if (loading || !profile || profile.role !== "superadmin") {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#22c55e]" size={32} />
      </div>
    );
  }

  return <CurriculumTimeline />;
}
