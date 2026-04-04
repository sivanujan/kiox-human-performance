"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Typewriter({ text, delay = 0, className = "" }: { text: string, delay?: number, className?: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let index = 0;
    let isDeleting = false;
    let typingTimer: NodeJS.Timeout;

    const startTypingUrl = () => {
      setIsTyping(true);
      const type = () => {
        if (!isDeleting && index < text.length) {
          // Typing forward
          setDisplayedText(text.slice(0, index + 1));
          index++;
          typingTimer = setTimeout(type, 100); // 100ms per char (slower, very noticeable)
        } else if (isDeleting && index > 0) {
          // Deleting backward
          setDisplayedText(text.slice(0, index - 1));
          index--;
          typingTimer = setTimeout(type, 50); // 50ms per char delete
        } else if (index === text.length) {
          // Reached the end, pause before deleting
          setIsTyping(false);
          isDeleting = true;
          typingTimer = setTimeout(() => {
            setIsTyping(true);
            type();
          }, 3000); // Wait 3 seconds at the end
        } else if (isDeleting && index === 0) {
          // Reached the beginning, pause before re-typing
          setIsTyping(false);
          isDeleting = false;
          typingTimer = setTimeout(() => {
            setIsTyping(true);
            type();
          }, 1000); // Wait 1 second before retyping
        }
      };
      type();
    };

    // Initial delay
    const initialTimer = setTimeout(startTypingUrl, delay * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(typingTimer);
    };
  }, [text, delay]);

  return (
    <span className={className}>
      {displayedText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-[10px] h-[1em] bg-[#22c55e] ml-[4px] align-middle"
        style={{ display: 'inline-block' }} 
      />
    </span>
  );
}
