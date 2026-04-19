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
    "border-r border-b lg:border-b-0 border-[rgba(34,197,94,0.2)]",
    "border-b lg:border-b-0 lg:border-r border-[rgba(34,197,94,0.2)]",
    "border-r border-[rgba(34,197,94,0.2)]",
    "",
  ];

  return (
    <section 
      ref={ref}
      className="w-full bg-[#111111] py-[40px] relative z-20"
      style={{
        borderTop: "1px solid rgba(34,197,94,0.2)",
        borderBottom: "1px solid rgba(34,197,94,0.2)" }}
    >
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 w-full">
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
                className={`flex flex-col items-center justify-center py-6 lg:py-4 px-2 ${borderClasses[index]}`}
              >
                <div className="text-[#22c55e] text-[48px] lg:text-[56px] font-stat font-black leading-none mb-2 tracking-tighter">
                  {isNumeric ? (
                    <CountUp end={numericValue} suffix={suffix} inView={isInView} />
                  ) : (
                    <span>{stat.number}</span>
                  )}
                </div>
                <div className="font-label text-gray-200 text-center font-black tracking-[0.2em] text-[11px]">
                  {stat.label}<br />
                  {stat.number === "Worldwide" && (
                    <span className="text-[#22c55e] text-[9px] lowercase tracking-widest font-mono font-bold">READY FOR DEPLOYMENT</span>
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
