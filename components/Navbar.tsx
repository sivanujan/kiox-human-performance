"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Loader2 } from "lucide-react";
import FAQModal from "./FAQModal";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./providers/AuthProvider";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const { user, profile, loading, signOut, supabase } = useAuth();
  const role = profile?.role || null;
  const router = useRouter();

  const hideNavbar = ["/signin", "/register", "/forgot-password", "/reset-password"].includes(pathname) || pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/staff");

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Services", href: "/#services" },
    { name: "Philosophy", href: "/#philosophy" },
    { name: "Excellence", href: "/#excellence" },
    { name: "Gallery", href: "/gallery" },
    { name: "Contact", href: "/#contact" },
    { name: "FAQ", action: () => setFaqOpen(true) },
  ];

  if (hideNavbar) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        mobileMenuOpen ? "h-screen bg-[#080808]" : "h-[60px] lg:h-[80px]"
      } ${
        isScrolled && !mobileMenuOpen ? "bg-kiox-black/90 backdrop-blur-xl border-b border-white/5 shadow-2xl" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-[40px] h-[60px] lg:h-[80px] flex items-center justify-between relative z-50">
        <Link href="/" className="flex items-center transition-transform hover:scale-105 group" style={{ gap: '10px' }}>
          <Image
            src="/newlogo.png"
            alt="KIO-X Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain lg:w-12 lg:h-12 m-0 p-0"
            style={{
              mixBlendMode: 'screen'
            }}
            priority
            unoptimized={true}
          />
          <span className="font-display font-black transition-transform duration-500 group-hover:scale-105 text-[1.3rem] tracking-[3px] lg:text-[2rem] lg:tracking-[6px] leading-none m-0 p-0 text-white">
            KIO-X
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-12">
          {navLinks.map((link) => (
            link.href ? (
              <Link
                key={link.name}
                href={link.href}
                className="group relative text-[11px] font-bold font-display text-gray-100 hover:text-white active:text-neon-green focus:text-neon-green transition-colors tracking-[0.25em] uppercase"
              >
                {link.name}
                <span className="absolute -bottom-2 left-0 w-0 h-px bg-neon-green transition-all duration-300 ease-out group-hover:w-full"></span>
              </Link>
            ) : (
              <button
                key={link.name}
                onClick={link.action}
                className="group relative text-[11px] font-bold font-display text-gray-100 hover:text-white active:text-neon-green focus:text-neon-green transition-colors tracking-[0.25em] uppercase cursor-pointer"
              >
                {link.name}
                <span className="absolute -bottom-2 left-0 w-0 h-px bg-neon-green transition-all duration-300 ease-out group-hover:w-full"></span>
              </button>
            )
          ))}
          
          <div className="flex items-center gap-6 pl-6 border-l border-white/10">
            {loading ? (
              <Loader2 className="animate-spin text-[#00ff88]" size={18} />
            ) : user ? (
              <div className="flex items-center gap-6">
                <Link 
                  href={role === 'superadmin' ? "/admin" : (role === 'staff' || role === 'medical') ? "/staff" : "/dashboard"} 
                  className="px-5 py-2 text-[10px] font-bold font-display tracking-widest uppercase border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/10 transition-all duration-300"
                >
                  {role === 'superadmin' ? "Admin Portal" : (role === 'staff' || role === 'medical') ? "Staff Portal" : "My Dashboard"}
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="text-[10px] font-bold font-display tracking-widest uppercase text-white/40 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  href="/signin" 
                  className="px-5 py-2 text-[12px] font-bold font-display tracking-widest uppercase border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10 transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="px-5 py-2 text-[12px] font-bold font-display tracking-widest uppercase bg-[#00ff88] text-black hover:bg-[#39ff9c] transition-all duration-300"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          className="lg:hidden flex items-center justify-center text-white hover:text-[#00ff88] transition-colors cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={26} strokeWidth={1.8} /> : <Menu size={26} strokeWidth={1.8} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        className={`lg:hidden fixed inset-0 w-full h-screen bg-[#080808] z-40 pt-[80px] lg:pt-[100px] pb-8 flex flex-col justify-between overflow-y-auto no-scrollbar transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex flex-col py-2 space-y-1">
          {navLinks.map((link, i) => {
            const indexStr = String(i + 1).padStart(2, '0');
            const linkContent = (
              <span className="flex items-center w-full">
                <span className="font-mono text-[9px] text-[#00ff41] tracking-normal w-6 select-none opacity-80">{indexStr}</span>
                <span className="flex-1 font-display font-[800] tracking-[0.25em]">{link.name}</span>
              </span>
            );

            return link.href ? (
              <Link
                key={link.name}
                href={link.href}
                className="group flex items-center px-8 py-3 text-[13px] font-display font-[800] uppercase text-white/70 hover:text-white hover:bg-white/[0.02] border-l-[3px] border-transparent hover:border-[#00ff88] hover:pl-10 transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                {linkContent}
              </Link>
            ) : (
              <button
                key={link.name}
                onClick={() => {
                  if (link.action) link.action();
                  setMobileMenuOpen(false);
                }}
                className="group flex items-center w-full text-left px-8 py-3 text-[13px] font-display font-[800] uppercase text-white/70 hover:text-white hover:bg-white/[0.02] border-l-[3px] border-transparent hover:border-[#00ff88] hover:pl-10 transition-all duration-300 cursor-pointer"
              >
                {linkContent}
              </button>
            );
          })}
        </div>
        
        <div className="flex flex-col gap-3 px-8 mt-2 pt-4 border-t border-white/5 pb-4">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="animate-spin text-[#00ff88]" size={20} />
            </div>
          ) : user ? (
            <>
              <Link 
                href={role === 'superadmin' ? "/admin" : (role === 'staff' || role === 'medical') ? "/staff" : "/dashboard"} 
                className="w-full text-center py-3.5 text-[11px] font-display font-extrabold tracking-[0.2em] uppercase bg-[#00ff88] text-black hover:bg-[#39ff9c] active:scale-[0.98] transition-all duration-300 rounded shadow-[0_0_15px_rgba(0,255,136,0.25)] font-label"
                onClick={() => setMobileMenuOpen(false)}
              >
                {role === 'superadmin' ? "Admin Portal" : (role === 'staff' || role === 'medical') ? "Staff Portal" : "My Dashboard"}
              </Link>
              <button 
                onClick={handleSignOut}
                className="w-full text-center py-3 text-[11px] font-display font-extrabold tracking-[0.2em] uppercase bg-[#1a1a1a] border border-white/20 hover:bg-[#222222] text-white hover:text-white active:scale-[0.98] transition-all duration-300 rounded font-label cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/signin" 
                className="w-full text-center py-3.5 text-[11px] font-display font-extrabold tracking-[0.2em] uppercase bg-[#1a1a1a] border border-white/20 hover:bg-[#222222] hover:border-white/30 text-white active:scale-[0.98] transition-all duration-300 rounded shadow-md font-label"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="w-full text-center py-3.5 text-[11px] font-display font-extrabold tracking-[0.2em] uppercase bg-[#00ff88] text-black hover:bg-[#39ff9c] active:scale-[0.98] transition-all duration-300 rounded shadow-[0_0_15px_rgba(0,255,136,0.25)] font-label"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <FAQModal isOpen={faqOpen} onClose={() => setFaqOpen(false)} />
    </header>
  );
}
