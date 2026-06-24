"use client";

import { useTheme } from "./providers/ThemeProvider";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  variant?: "pill" | "icon";
}

export default function ThemeToggle({ variant = "pill" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (variant === "icon") {
      return <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]/50" />;
    }
    return <div className="w-[52px] h-[28px] rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)]/50" />;
  }

  if (variant === "icon") {
    return (
      <button
        onClick={toggleTheme}
        className={`w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border flex items-center justify-center transition-all duration-300 outline-none select-none active:scale-95 shrink-0 ${
          theme === "dark" 
            ? "border-white/10 text-white/40 hover:text-[var(--accent-green)] hover:border-[var(--accent-green)]/30" 
            : "border-[var(--border-primary)] text-[var(--accent-green)] hover:text-[var(--accent-green)] hover:border-[var(--accent-green)]/50 bg-[var(--bg-badge-coaches)]/50"
        }`}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center w-[52px] h-[28px] rounded-full p-1 cursor-pointer transition-all duration-300 outline-none select-none hover:opacity-90 active:scale-95 shrink-0 ${
        theme === "dark" 
          ? "bg-[var(--bg-primary)] border border-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]" 
          : "bg-[var(--bg-badge-coaches)] border border-[var(--accent-green)]/30 shadow-[inset_0_1px_3px_rgba(0,168,85,0.15)]"
      }`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {/* Icon */}
      <span 
        className={`z-10 flex items-center justify-center w-5 h-5 text-[11px] leading-none pointer-events-none transition-transform duration-300 ${
          theme === "dark" ? "translate-x-0" : "translate-x-[24px]"
        }`}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </span>

      {/* Thumb */}
      <span
        className={`absolute w-5 h-5 rounded-full transition-transform duration-300 ease-in-out ${
          theme === "dark"
            ? "translate-x-[24px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_8px_rgba(255,255,255,0.5)]"
            : "translate-x-0 bg-[var(--accent-green)] shadow-[0_1px_3px_rgba(0,0,0,0.15),0_0_8px_rgba(0,168,85,0.4)]"
        }`}
      />
    </button>
  );
}
