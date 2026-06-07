"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Loader() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [percent, setPercent] = useState(0);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPercent(100);
    setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = "";
      sessionStorage.setItem("kiox-loader-shown", "true");
    }, 500);
  };

  useEffect(() => {
    setIsMounted(true);

    // Skip loader if already shown this session
    if (sessionStorage.getItem("kiox-loader-shown")) {
      setIsLoading(false);
      return;
    }

    // Lock scroll only (no opacity manipulation on body)
    document.body.style.overflow = "hidden";

    const updateProgress = (value: number) => {
      setPercent((prev) => {
        const next = Math.max(prev, value);
        if (next >= 100) finish();
        return next;
      });
    };

    // Milestone 1: Fonts (25%)
    document.fonts.ready.then(() => updateProgress(25));

    // Milestone 2: Images (50%)
    const imagePromises = Array.from(document.images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((res) => {
        img.addEventListener("load", () => res(), { once: true });
        img.addEventListener("error", () => res(), { once: true });
      });
    });
    Promise.all(imagePromises).then(() => updateProgress(50));

    // Milestone 3: Hero video (75%)
    const video = document.getElementById("hero-video") as HTMLVideoElement | null;
    if (video) {
      if (video.readyState >= 3) {
        updateProgress(75);
      } else {
        video.addEventListener("canplay", () => updateProgress(75), { once: true });
      }
    } else {
      updateProgress(75);
    }

    // Milestone 4: All fonts + images done → 100%
    Promise.all([document.fonts.ready, Promise.all(imagePromises)]).then(() => {
      setTimeout(() => updateProgress(100), 100);
    });

    // Hard fallback: force finish after 4 seconds no matter what
    const fallback = setTimeout(finish, 4000);

    return () => {
      clearTimeout(fallback);
      document.body.style.overflow = "auto";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isMounted) return null;

  // Dynamically cycle through sports loading phrases
  let loadingPhrase = "ANALYZING PERFORMANCE...";
  if (percent > 90) {
    loadingPhrase = "READY";
  } else if (percent > 60) {
    loadingPhrase = "LOADING ELITE PROTOCOLS...";
  } else if (percent > 30) {
    loadingPhrase = "CALIBRATING TRAINING DATA...";
  }

  const letters = ["K", "I", "O", "-", "X"];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.6, ease: "easeInOut" },
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "#0a0a0a",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Sports speed lines sweeping across the background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.15]">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-0 bottom-0 w-[3px]"
                style={{
                  left: "-20%",
                  background: "linear-gradient(to bottom, transparent, #00ff88, transparent)",
                  transform: "skewX(-35deg)",
                }}
                animate={{
                  left: ["-20%", "120%"],
                }}
                transition={{
                  duration: 1.2 + i * 0.25,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Container with Radial Glow Pulse */}
            <div className="relative flex flex-col items-center mb-6">
              <motion.div
                className="absolute w-32 h-32 rounded-full bg-[#00ff88]/10 blur-xl"
                animate={{
                  scale: [0.9, 1.2, 0.9],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10"
              >
                <Image
                  src="/logo.png"
                  alt="KIO-X"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </motion.div>
            </div>

            {/* KIO-X Text */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "32px" }}>
              {letters.map((letter, i) => (
                <motion.span
                  key={i}
                  className="font-display"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2 + i * 0.08,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                  style={{
                    fontSize: "32px",
                    background: "linear-gradient(135deg, #ffffff, #00ff88)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "4px",
                    fontWeight: "900",
                    display: "inline-block",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center mb-8">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="88"
                  cy="88"
                  r="68"
                  className="stroke-white/5"
                  strokeWidth="5"
                  fill="transparent"
                />
                {/* Active Progress Ring */}
                <motion.circle
                  cx="88"
                  cy="88"
                  r="68"
                  className="stroke-[#00ff88]"
                  strokeWidth="5"
                  fill="transparent"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: "427", // Circumference of r=68 is 2 * PI * 68 ≈ 427.25
                  }}
                  animate={{
                    strokeDashoffset: 427 - (427 * percent) / 100,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </svg>

              {/* Central Bold Percentage */}
              <div className="absolute flex flex-col items-center">
                <span className="text-[2.8rem] font-black tracking-tighter text-[#00ff88] font-display leading-none">
                  {percent}
                </span>
                <span className="text-[10px] text-white/40 tracking-[0.2em] font-bold mt-1">
                  PERCENT
                </span>
              </div>
            </div>

            {/* Horizontal progress bar */}
            <div className="w-56 h-[2px] bg-white/5 relative overflow-hidden mb-6 rounded-full">
              <motion.div
                className="absolute left-0 top-0 bottom-0 bg-[#00ff88]"
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Dynamic Sports phrase cycling */}
            <div className="h-4 flex items-center justify-center">
              <motion.p
                key={loadingPhrase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-[9px] font-bold font-display tracking-[0.25em] text-[#00ff88] uppercase"
              >
                {loadingPhrase}
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
