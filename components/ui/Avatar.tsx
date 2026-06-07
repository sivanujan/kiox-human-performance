"use client";

import { User as UserIcon, ShieldCheck, Trophy } from "lucide-react";
import Image from "next/image";


interface AvatarProps {
  src?: string | null;
  name?: string;
  role?: "athlete" | "staff" | "superadmin";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function Avatar({ src, name, role, size = "md", className = "" }: AvatarProps) {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };

  const iconSizeMap = {
    sm: 14,
    md: 18,
    lg: 28,
    xl: 32,
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "";

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden border-2 border-[#00ff88]/30 bg-[#00ff88]/5 shadow-[0_0_20px_rgba(0,255,136,0.1)] ${sizeMap[size]} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name || "User Avatar"}
          fill
          className="object-cover"
          unoptimized={true} // Recommended for external Supabase URLs
        />
      ) : (
        <div className="flex items-center justify-center text-[#00ff88] font-black uppercase tracking-tighter">
          {initials || (
            role === "superadmin" ? <ShieldCheck size={iconSizeMap[size]} /> :
            role === "staff" ? <Trophy size={iconSizeMap[size]} /> :
            <UserIcon size={iconSizeMap[size]} className="opacity-20" />
          )}
        </div>
      )}
      
      {/* Decorative inner glow */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#00ff88]/10 to-transparent pointer-events-none" />
    </div>
  );
}
