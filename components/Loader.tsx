"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Anton } from "next/font/google";

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

export default function Loader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if loader was already shown in this session
    const hasShownLoader = sessionStorage.getItem("kiox-loader-shown");
    
    if (hasShownLoader) {
      setIsLoading(false);
      return;
    }

    // Lock scroll while loading
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = "auto";
      sessionStorage.setItem("kiox-loader-shown", "true");
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "auto";
    };
  }, []);

  const letters = ["K", "I", "O", "-", "X"];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            y: "-100%",
            transition: { duration: 0.8, ease: "easeInOut" }
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
          <div style={{ 
            display: "flex", 
            gap: "4px",
            marginTop: "20px" 
          }}>
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                className={anton.className}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.5 + (i * 0.1),
                  duration: 0.4,
                  ease: "easeOut"
                }}
                style={{
                  fontSize: "48px",
                  background: "linear-gradient(135deg, #ffffff, #22c55e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "6px",
                  display: "inline-block" // Ensure transform works
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Gold line draw */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            transition={{ 
              delay: 1.5, 
              duration: 0.5,
              ease: "easeInOut"
            }}
            style={{
              height: "1px",
              background: "#22c55e",
              marginTop: "16px"
            }}
          />

          {/* Human Performance text */}
          <motion.p
            className={anton.className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.4 }}
            style={{
              color: "#22c55e",
              fontSize: "12px",
              letterSpacing: "6px",
              marginTop: "12px"
            }}
          >
            HUMAN PERFORMANCE
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 2.5,
              ease: "linear"
            }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: "2px",
              background: "linear-gradient(90deg, transparent, #22c55e, transparent)",
            }}
          />

        </motion.div>
      )}
    </AnimatePresence>
  );
}
