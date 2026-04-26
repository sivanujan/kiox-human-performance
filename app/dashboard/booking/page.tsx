"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function BookingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/booking/coach');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-[#22c55e] animate-spin" size={32} />
      <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest animate-pulse">
        Initializing Tactical Hub...
      </span>
    </div>
  );
}
