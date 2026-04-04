"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const hideFooter = ["/signin", "/register", "/forgot-password", "/reset-password"].includes(pathname) || pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/staff");

  if (hideFooter) return null;

  return (
    <footer className="bg-kiox-black border-t border-white/5 py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-texture opacity-20 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 md:px-10 flex flex-col items-center justify-center text-center relative z-10">
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6 uppercase">KIO-X</h2>
        <p className="font-sans text-gray-400 text-sm tracking-[0.15em] mb-12 max-w-sm uppercase">
          Elite Human Performance Training
        </p>
        
        <div className="flex items-center gap-8 mb-12">
          {["Instagram", "Twitter", "LinkedIn", "YouTube"].map((social) => (
            <Link key={social} href="#" className="font-sans text-xs font-semibold tracking-[0.2em] text-gray-500 hover:text-gold uppercase transition-colors">
              {social}
            </Link>
          ))}
        </div>
        
        <div className="w-full h-px bg-white/5 mb-8 max-w-2xl" />
        
        <div className="text-gray-600 text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium">
          &copy; {new Date().getFullYear()} KIO-X Human Performance. All rights reserved. Made for Elite Athletes.
        </div>
      </div>
    </footer>
  );
}
