"use client";

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const segments = [
  { id: 1, label: 'EDUCATION', points: ['Dual development sport & life', 'Mentoring & guidance program'] },
  { id: 2, label: 'ATHLETICS', points: ['Holistic training approach', 'Multi-level performance sessions'] },
  { id: 3, label: 'TECHNIQUE', points: ['Advanced movement simulators', 'Video-based performance analysis'] },
  { id: 4, label: 'TACTICS', points: ['Game phase specific tactics', 'Individual player analysis'] },
  { id: 5, label: 'NUTRITION', points: ['Science-based holistic approach', 'Individualized nutrition planning'] },
  { id: 6, label: 'HEALTH', points: ['Systematic diagnostic testing', 'Individual performance values'] },
  { id: 7, label: 'PSYCHOLOGY', points: ['Mental resilience development', 'Behavioral & social coaching'] },
  { id: 8, label: 'MENTALITY', points: ['Individualized growth approach', 'Preventive mental measures'] },
];

const leftSegments = segments.slice(0, 4);
const rightSegments = [...segments.slice(4)].reverse();

function WheelSVG({ activeId, setActiveId }: { activeId: number | null, setActiveId: (id: number | null) => void }) {
  const size = 460;
  const cx = 230;
  const cy = 230;
  const innerR = 100;
  const outerR = 210;

  return (
    <svg 
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[460px] aspect-square h-auto mx-auto relative z-10"
    >
      <defs>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="wheelGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={outerR + 30} fill="url(#wheelGlow)" />

      {[8, 7, 6, 5, 4, 3, 2, 1].map((id, i) => {
        const seg = segments.find(s => s.id === id);
        if (!seg) return null;
        const total = 8;
        const gap = 0.04;
        const angle = (2 * Math.PI) / total;
        const offset = -Math.PI / 2;
        const start = offset + i * angle + gap / 2;
        const end = offset + (i + 1) * angle - gap / 2;

        const x1 = (cx + Math.cos(start) * outerR).toFixed(2);
        const y1 = (cy + Math.sin(start) * outerR).toFixed(2);
        const x2 = (cx + Math.cos(end) * outerR).toFixed(2);
        const y2 = (cy + Math.sin(end) * outerR).toFixed(2);
        const x3 = (cx + Math.cos(end) * innerR).toFixed(2);
        const y3 = (cy + Math.sin(end) * innerR).toFixed(2);
        const x4 = (cx + Math.cos(start) * innerR).toFixed(2);
        const y4 = (cy + Math.sin(start) * innerR).toFixed(2);

        const mid = start + angle / 2;
        const numR = innerR + (outerR - innerR) / 2;
        const numX = (cx + Math.cos(mid) * numR).toFixed(2);
        const numY = (cy + Math.sin(mid) * numR).toFixed(2);

        const isActive = activeId === seg.id;

        return (
          <g 
            key={seg.id}
            onMouseEnter={() => setActiveId(seg.id)}
            onMouseLeave={() => setActiveId(null)}
            className="cursor-pointer"
          >
            <path
              d={`M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`}
              fill={isActive ? "color-mix(in srgb, var(--accent-green) 30%, transparent)" : "color-mix(in srgb, var(--accent-green) 6%, transparent)"}
              stroke={isActive ? "var(--accent-green)" : "color-mix(in srgb, var(--accent-green) 30%, transparent)"}
              strokeWidth="1.5"
              className="transition-all duration-300"
            />
            <text
              x={numX} y={numY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isActive ? "var(--accent-green)" : "color-mix(in srgb, var(--accent-green) 40%, transparent)"}
              fontSize="20"
              className="font-bold tracking-wider transition-all duration-300 font-label"
            >
              {seg.id}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={innerR} fill="var(--bg-primary)" stroke="var(--accent-green)" strokeWidth="2.5" filter="url(#glow2)" />
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="color-mix(in srgb, var(--accent-green) 50%, transparent)" strokeWidth="1.5" filter="url(#glow2)" />
      <circle cx={cx} cy={cy} r={outerR + 12} fill="none" stroke="var(--border-accent-trans)" strokeWidth="1" />
    </svg>
  );
}

export default function PlayerDevelopment() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section 
      id="philosophy" 
      ref={ref} 
      className="py-24 md:py-32 bg-bg-primary transition-colors duration-300 relative overflow-hidden w-full"
    >
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(var(--accent-green) 1px, transparent 1px), linear-gradient(90deg, var(--accent-green) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container mx-auto px-4 md:px-10 max-w-[1300px] relative z-10 w-full">
        {/* TITLE */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16 md:mb-20"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-accent-green" />
            <span className="text-xs tracking-[0.4em] text-accent-green uppercase font-bold font-label">
              KIO-X PHILOSOPHY
            </span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-accent-green" />
          </div>
          <h2 className="font-display text-4xl md:text-7xl font-black tracking-tight text-text-primary uppercase italic leading-none">
            PLAYER DEVELOPMENT
          </h2>
          <p className="text-accent-green text-sm md:text-base tracking-[0.3em] font-label font-bold mt-4">
            360° SUPPORT
          </p>
        </motion.div>

        {/* 3 COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 items-center w-full max-w-[1200px] mx-auto">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-1 w-full order-1 lg:order-none" onMouseLeave={() => setActiveId(null)}>
            {leftSegments.map((seg, i) => (
              <motion.div
                key={seg.id}
                onMouseEnter={() => setActiveId(seg.id)}
                variants={{
                  hidden: { opacity: 0, x: -40 },
                  visible: { opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)', scale: 1, transition: { delay: 0.2 + i * 0.15, duration: 0.6 } },
                  active: { opacity: 1, x: 0, backgroundColor: 'var(--shadow-accent)', scale: 1.03, transition: { duration: 0.2 } }
                }}
                initial="hidden"
                animate={isInView ? (activeId === seg.id ? "active" : "visible") : "hidden"}
                className="py-6 px-5 cursor-pointer transition-all duration-300 rounded-r-lg lg:rounded-r-none lg:rounded-l-lg border-l-2 lg:border-l-0 lg:border-r-2 relative transform-origin-right-center text-left lg:text-right"
                style={{
                  borderLeftColor: activeId === seg.id ? 'var(--accent-green)' : 'transparent',
                  borderRightColor: activeId === seg.id ? 'var(--accent-green)' : 'var(--border-accent-trans)',
                }}
              >
                {activeId === seg.id && (
                  <motion.div 
                    layoutId="activeDotLeft" 
                    className="absolute left-[-5.5px] lg:left-auto lg:right-[-5.5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent-green shadow-[0_0_15px_var(--accent-green)] z-10"
                  />
                )}
                <div className="mb-2 flex items-baseline justify-start lg:justify-end gap-2">
                  <span className="text-accent-green/70 text-lg font-stat font-black tracking-wide">{String(seg.id).padStart(2, '0')}</span>
                  <span className={`text-lg sm:text-xl font-display font-black tracking-wide uppercase transition-colors duration-300 ${activeId === seg.id ? 'text-accent-green' : 'text-text-primary'}`}>{seg.label}</span>
                </div>
                <div className="w-8 h-0.5 bg-accent-green ml-0 lg:ml-auto lg:mr-0 mb-3 shadow-[0_0_6px_var(--accent-green)]" />
                {seg.points.map((p, pi) => (
                  <div key={pi} className="text-text-secondary text-xs sm:text-sm leading-relaxed mb-1 flex items-start justify-start lg:justify-end gap-2 font-label font-medium">
                    <span className="lg:hidden text-accent-green text-[8px] mt-1.5 shrink-0">▶</span>
                    <span>{p}</span>
                    <span className="hidden lg:inline text-accent-green text-[8px] mt-1.5 shrink-0">▶</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>

          {/* CENTER WHEEL */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={isInView ? { opacity: 1, scale: 1 } : {}} 
            transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 80 }} 
            className="relative w-full max-w-[320px] xs:max-w-[380px] sm:max-w-[460px] aspect-square mx-auto order-first lg:order-none z-10 flex items-center justify-center py-6 lg:py-0"
          >
            {/* Spinning decorative rings */}
            <div 
              className="absolute w-[110%] h-[110%] rounded-full border border-dashed border-accent-green/15 pointer-events-none hidden lg:block" 
              style={{ animation: 'spinCW 25s linear infinite' }}
            />
            <div 
              className="absolute w-[125%] h-[125%] rounded-full border border-dashed border-accent-green/8 pointer-events-none hidden lg:block" 
              style={{ animation: 'spinCCW 35s linear infinite' }}
            />
            
            {/* Main Interactive Wheel SVG */}
            <WheelSVG activeId={activeId} setActiveId={setActiveId} />
            
            {/* Center Video Frame */}
            <div className="absolute w-[130px] xs:w-[150px] sm:w-[190px] h-[130px] xs:h-[150px] sm:h-[190px] rounded-full overflow-hidden border-3 border-accent-green shadow-[0_0_0_6px_var(--border-accent-trans),_0_0_40px_var(--shadow-accent-glow),_0_0_80px_var(--shadow-accent)] z-20">
              <video autoPlay muted loop playsInline className="w-full h-full object-cover object-top">
                <source src="/videos/vidcen.mp4" type="video/mp4" />
              </video>
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-1 w-full order-2 lg:order-none" onMouseLeave={() => setActiveId(null)}>
            {rightSegments.map((seg, i) => (
              <motion.div
                key={seg.id}
                onMouseEnter={() => setActiveId(seg.id)}
                variants={{
                  hidden: { opacity: 0, x: 40 },
                  visible: { opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)', scale: 1, transition: { delay: 0.2 + i * 0.15, duration: 0.6 } },
                  active: { opacity: 1, x: 0, backgroundColor: 'var(--shadow-accent)', scale: 1.03, transition: { duration: 0.2 } }
                }}
                initial="hidden"
                animate={isInView ? (activeId === seg.id ? "active" : "visible") : "hidden"}
                className="py-6 px-5 cursor-pointer transition-all duration-300 rounded-r-lg border-l-2 relative transform-origin-left-center text-left"
                style={{
                  borderLeftColor: activeId === seg.id ? 'var(--accent-green)' : 'var(--border-accent-trans)',
                }}
              >
                {activeId === seg.id && (
                  <motion.div 
                    layoutId="activeDotRight" 
                    className="absolute left-[-5.5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent-green shadow-[0_0_15px_var(--accent-green)] z-10"
                  />
                )}
                <div className="mb-2 flex items-baseline justify-start gap-2">
                  <span className="text-accent-green/70 text-lg font-stat font-black tracking-wide">{String(seg.id).padStart(2, '0')}</span>
                  <span className={`text-lg sm:text-xl font-display font-black tracking-wide uppercase transition-colors duration-300 ${activeId === seg.id ? 'text-accent-green' : 'text-text-primary'}`}>{seg.label}</span>
                </div>
                <div className="w-8 h-0.5 bg-accent-green mb-3 shadow-[0_0_6px_var(--accent-green)]" />
                {seg.points.map((p, pi) => (
                  <div key={pi} className="text-text-secondary text-xs sm:text-sm leading-relaxed mb-1 flex items-start gap-2 font-label font-medium">
                    <span className="text-accent-green text-[8px] mt-1.5 shrink-0">▶</span>
                    <span>{p}</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
