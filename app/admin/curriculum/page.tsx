"use client";

import CurriculumTimeline from "@/components/curriculum/CurriculumTimeline";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminCurriculumPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && !['superadmin', 'admin', 'staff', 'coach', 'medical'].includes(profile.role)) {
      router.push("/dashboard");
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--accent-green)]" />
      </div>
    );
  }

  if (!profile || !['superadmin', 'admin', 'staff', 'coach', 'medical'].includes(profile.role)) return null;

  return <CurriculumTimeline />;
}
