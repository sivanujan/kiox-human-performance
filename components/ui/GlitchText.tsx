"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function GlitchText({ text, className = "", duration = 2000 }: { text: string, className?: string, duration?: number }) {
  const [isGlitching, setIsGlitching] = useState(true);

  useEffect(() => {
    const stopTimer = setTimeout(() => setIsGlitching(false), duration);
    return () => clearTimeout(stopTimer);
  }, [duration]);

  return (
    <motion.span
      className={className}
      animate={isGlitching ? {
        color: ["#22c55e", "#ffffff", "#22c55e", "#22c55e", "#ffffff", "#22c55e", "#22c55e"],
        skewX: [0, -15, 10, -5, 20, -10, 0],
        x: [0, 8, -8, 5, -5, 2, 0]
      } : {
        color: "#22c55e",
        skewX: 0,
        x: 0
      }}
      transition={isGlitching ? {
        duration: 0.15,
        repeat: Infinity,
        repeatType: "mirror"
      } : { duration: 0.3 }}
      style={{ display: "inline-block" }}
    >
      {text}
    </motion.span>
  );
}
