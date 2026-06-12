"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { number: "1000+", label: "Athletes Trained" },
  { number: "Worldwide", label: "Global Reach" },
  { number: "20+", label: "Years Experience" },
  { number: "Elite-Pro", label: "Level Training" },
];

const CountUp = ({ end, suffix, inView }: { end: number, suffix: string, inView: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let start = 0;
    const duration = 2000;
    if (end === 0) {
      setCount(0);
      return;
    }
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, inView]);

  return <span>{count}{suffix}</span>;
};

export default function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const borderClasses = [
    "border-r border-b lg:border-b-0 border-border-primary/50",
    "border-b lg:border-b-0 lg:border-r border-border-primary/50",
    "border-r border-border-primary/50",
    "",
  ];

  return (
    <section 
      ref={ref}
      className="w-full max-w-full overflow-hidden bg-bg-card py-[40px] relative z-20 transition-colors duration-300"
      style={{
        borderTop: "1px solid var(--border-primary)",
        borderBottom: "1px solid var(--border-primary)" }}
    >
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 w-full max-w-full overflow-hidden">
          {stats.map((stat, index) => {
            const isNumeric = /\d/.test(stat.number);
            const numericValue = isNumeric ? parseInt(stat.number.replace(/\D/g, "")) : 0;
            const suffix = isNumeric ? stat.number.replace(/\d/g, "") : "";

            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className={`flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden ${borderClasses[index]}`}
              >
                <div className={`text-accent-green font-stat font-black leading-none mb-2 tracking-tighter ${
                  isNumeric ? "text-[clamp(1.5rem,6vw,3rem)]" : "text-[clamp(1.2rem,5vw,2.5rem)]"
                } lg:text-[56px]`}>
                  {isNumeric ? (
                    <CountUp end={numericValue} suffix={suffix} inView={isInView} />
                  ) : (
                    <span>{stat.number}</span>
                  )}
                </div>
                <div className="font-label text-text-primary text-center font-black tracking-[0.2em] text-[11px] leading-tight">
                  {stat.label}<br />
                  {stat.number === "Worldwide" && (
                    <span className="text-accent-green text-[9px] uppercase tracking-widest font-mono font-bold mt-1 block">GLOBAL NETWORK</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
