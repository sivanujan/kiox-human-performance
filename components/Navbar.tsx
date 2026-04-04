"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Anton } from "next/font/google";
import FAQModal from "./FAQModal";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-colors duration-500 h-[80px] ${
        isScrolled ? "bg-kiox-black/90 backdrop-blur-xl border-b border-white/5 shadow-2xl" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-[40px] h-full flex items-center justify-between">
        <Link href="/" className="flex items-center transition-transform hover:scale-105 group" style={{ gap: '10px' }}>
          <div className="w-[66px] h-[66px] rounded-full border border-white/20 bg-kiox-black/50 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Image
              src="/newlogo.png"
              alt="KIO-X Logo"
              width={58}
              height={58}
              className="object-contain"
              style={{
                mixBlendMode: 'screen'
              }}
              priority
              unoptimized={true}
            />
          </div>
          <span className={`${anton.className} transition-transform duration-500 group-hover:scale-105`}
            style={{
              fontSize: '40px',
              letterSpacing: '6px',
              lineHeight: 1,
              color: '#ffffff'
            }}>
            KIO-X
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-12">
          {navLinks.map((link) => (
            link.href ? (
              <Link
                key={link.name}
                href={link.href}
                className="group relative text-sm font-medium text-gray-300 hover:text-white active:text-gold focus:text-gold transition-colors tracking-[0.15em] uppercase"
              >
                {link.name}
                <span className="absolute -bottom-2 left-0 w-0 h-px bg-gold transition-all duration-300 ease-out group-hover:w-full"></span>
              </Link>
            ) : (
              <button
                key={link.name}
                onClick={link.action}
                className="group relative text-sm font-medium text-gray-300 hover:text-white active:text-gold focus:text-gold transition-colors tracking-[0.15em] uppercase cursor-pointer"
              >
                {link.name}
                <span className="absolute -bottom-2 left-0 w-0 h-px bg-gold transition-all duration-300 ease-out group-hover:w-full"></span>
              </button>
            )
          ))}
          
          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            <Link 
              href="/signin" 
              className="px-5 py-2 text-[12px] font-bold tracking-widest uppercase border border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10 transition-all duration-300"
            >
              Sign In
            </Link>
            <Link 
              href="/signin" 
              className="px-5 py-2 text-[12px] font-bold tracking-widest uppercase bg-[#22c55e] text-black hover:bg-[#4ade80] transition-all duration-300"
            >
              Register
            </Link>
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white hover:text-gold transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={32} strokeWidth={1.5} /> : <Menu size={32} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-kiox-black/95 backdrop-blur-2xl border-b border-white/10 flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-96 py-6" : "max-h-0 py-0"
        }`}
      >
        {navLinks.map((link) => (
          link.href ? (
            <Link
              key={link.name}
              href={link.href}
              className="text-white hover:text-gold transition-colors py-4 px-8 text-sm tracking-[0.2em] uppercase font-medium border-b border-white/5 last:border-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ) : (
            <button
              key={link.name}
              onClick={() => {
                if (link.action) link.action();
                setMobileMenuOpen(false);
              }}
              className="text-left w-full text-white hover:text-gold transition-colors py-4 px-8 text-sm tracking-[0.2em] uppercase font-medium border-b border-white/5 last:border-0"
            >
              {link.name}
            </button>
          )
        ))}
        
        <div className="flex flex-col gap-4 px-8 mt-6 pb-6">
          <Link 
            href="/signin" 
            className="w-full text-center py-4 text-[12px] font-bold tracking-widest uppercase border border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10"
            onClick={() => setMobileMenuOpen(false)}
          >
            Sign In
          </Link>
          <Link 
            href="/signin" 
            className="w-full text-center py-4 text-[12px] font-bold tracking-widest uppercase bg-[#22c55e] text-black hover:bg-[#4ade80]"
            onClick={() => setMobileMenuOpen(false)}
          >
            Register
          </Link>
        </div>
      </div>

      <FAQModal isOpen={faqOpen} onClose={() => setFaqOpen(false)} />
    </header>
  );
}
