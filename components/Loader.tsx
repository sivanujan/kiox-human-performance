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

  const letters = ["K", "I", "O", "-", "X"];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: "-100%",
            transition: { duration: 0.7, ease: "easeInOut" },
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "#080808",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Image
              src="/newlogo.png"
              alt="KIO-X"
              width={100}
              height={100}
              className="object-contain"
              priority
            />
          </motion.div>

          {/* KIO-X Letters stagger */}
          <div style={{ display: "flex", gap: "4px", marginTop: "20px" }}>
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                className="font-display"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.5 + i * 0.1,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                style={{
                  fontSize: "48px",
                  background: "linear-gradient(135deg, #ffffff, #22c55e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "6px",
                  display: "inline-block",
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Green line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            transition={{ delay: 1.5, duration: 0.5, ease: "easeInOut" }}
            style={{ height: "1px", background: "#22c55e", marginTop: "16px" }}
          />

          {/* Human Performance text */}
          <motion.p
            className="font-display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.4 }}
            style={{
              color: "#22c55e",
              fontSize: "12px",
              letterSpacing: "6px",
              marginTop: "12px",
            }}
          >
            HUMAN PERFORMANCE
          </motion.p>

          {/* Percentage Counter */}
          <motion.span
            key={percent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              color: "#00ff88",
              fontSize: "48px",
              fontWeight: "bold",
              textTransform: "uppercase",
              marginTop: "20px",
            }}
          >
            {percent}%
          </motion.span>

          {/* Progress bar */}
          <motion.div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: "4px",
              background: "#00ff88",
            }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.4, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
