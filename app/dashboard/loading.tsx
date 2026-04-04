import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-[#22c55e] animate-spin" size={48} />
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Initializing Dashboard...</p>
      </div>
    </div>
  );
}