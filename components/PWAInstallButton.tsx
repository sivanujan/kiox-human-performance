"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent standard browser bar from showing
      e.preventDefault();
      // Store event
      setDeferredPrompt(e);
      // Show install prompt button
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log("KIO-X App installed successfully!");
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if already in standalone display mode (running as installed app)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone;
      
    if (isStandalone) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show browser install dialog
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install user response: ${outcome}`);
    
    // Clear deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2"
      >
        {/* Glowing cyberpunk tactical installer button */}
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2.5 bg-[#0a0e17]/95 hover:bg-[#22c55e] text-white hover:text-black border border-[#22c55e]/30 hover:border-[#22c55e] px-5 py-3.5 rounded-full font-sans text-[10px] font-black uppercase tracking-[2px] shadow-[0_0_25px_rgba(34,197,94,0.12)] hover:shadow-[0_0_30px_rgba(34,197,94,0.35)] active:scale-[0.97] transition-all duration-300 cursor-pointer"
        >
          <Download size={13} className="animate-bounce" />
          <span>Add to Home Screen</span>
        </button>

        {/* Dismiss trigger */}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-3.5 bg-[#0a0e17]/95 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 rounded-full shadow-2xl active:scale-[0.9] transition-all cursor-pointer"
          title="Dismiss"
        >
          <X size={12} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
