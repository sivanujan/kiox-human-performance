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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="wheelGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
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
            style={{ cursor: 'pointer' }}
          >
            <path
              d={`M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`}
              fill={isActive ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.06)"}
              stroke={isActive ? "#22c55e" : "rgba(34,197,94,0.3)"}
              strokeWidth="1.5"
              style={{ transition: 'all 0.3s ease' }}
            />
            <text
              x={numX} y={numY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isActive ? "#22c55e" : "rgba(34,197,94,0.4)"}
              fontSize="20"
              style={{ 
                fontFamily: 'var(--font-anton), sans-serif',
                fontWeight: 900,
                transition: 'all 0.3s ease'
              }}
            >
              {seg.id}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={innerR} fill="rgba(0,0,0,0.9)" stroke="#22c55e" strokeWidth="2.5" filter="url(#glow2)" />
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" filter="url(#glow2)" />
      <circle cx={cx} cy={cy} r={outerR + 12} fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="1" />
    </svg>
  );
}

export default function PlayerDevelopment() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="philosophy" ref={ref} style={{ background: '#080808', padding: '100px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Grid bg */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />

      {/* TITLE */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        style={{ textAlign: 'center', marginBottom: '70px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{ width: '50px', height: '1px', background: 'linear-gradient(90deg, transparent, #22c55e)' }} />
          <span style={{ color: '#22c55e', fontSize: '12px', letterSpacing: '0.4em', fontFamily: 'var(--font-anton), sans-serif' }}>KIO-X PHILOSOPHY</span>
          <div style={{ width: '50px', height: '1px', background: 'linear-gradient(90deg, #22c55e, transparent)' }} />
        </div>
        <h2 style={{ color: '#fff', fontFamily: 'var(--font-anton), sans-serif', fontSize: 'clamp(36px, 5vw, 68px)', margin: '0 0 8px', textTransform: 'uppercase' }}>PLAYER DEVELOPMENT</h2>
        <p style={{ color: '#22c55e', fontSize: '16px', letterSpacing: '0.3em', margin: 0 }}>360° SUPPORT</p>
      </motion.div>

      {/* 3 COLUMN LAYOUT */}
      <div className="wheel-layout" style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '40px', alignItems: 'center' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }} onMouseLeave={() => setActiveId(null)}>
          {leftSegments.map((seg, i) => (
            <motion.div
              key={seg.id}
              onMouseEnter={() => setActiveId(seg.id)}
              variants={{
                hidden: { opacity: 0, x: -40 },
                visible: { opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)', scale: 1, transition: { delay: 0.2 + i * 0.15, duration: 0.6 } },
                active: { opacity: 1, x: 0, backgroundColor: 'rgba(34,197,94,0.06)', scale: 1.03, transition: { duration: 0.2 } }
              }}
              initial="hidden"
              animate={isInView ? (activeId === seg.id ? "active" : "visible") : "hidden"}
              style={{
                padding: '24px 20px',
                borderRight: `2px solid ${activeId === seg.id ? '#22c55e' : 'rgba(34,197,94,0.15)'}`,
                textAlign: 'right',
                cursor: 'pointer',
                transition: 'border 0.3s ease',
                borderRadius: '8px 0 0 8px',
                position: 'relative',
                transformOrigin: 'right center' }}
            >
              {activeId === seg.id && (
                <motion.div layoutId="activeDotLeft" style={{ position: 'absolute', right: '-5.5px', top: '50%', transform: 'translateY(-50%)', width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 15px #22c55e', zIndex: 5 }} />
              )}
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '8px' }}>
                <span style={{ color: 'rgba(34,197,94,0.7)', fontSize: '18px', fontFamily: 'var(--font-anton), sans-serif', letterSpacing: '0.1em' }}>{String(seg.id).padStart(2, '0')}</span>
                <span style={{ color: activeId === seg.id ? '#22c55e' : '#ffffff', fontSize: '20px', fontFamily: 'var(--font-anton), sans-serif', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'color 0.3s ease' }}>{seg.label}</span>
              </div>
              <div style={{ width: '30px', height: '2px', background: '#22c55e', marginLeft: 'auto', marginBottom: '10px', boxShadow: '0 0 6px #22c55e' }} />
              {seg.points.map((p, pi) => (
                <div key={pi} style={{ color: '#777777', fontSize: '13px', lineHeight: '1.6', marginBottom: '4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: '6px' }}>
                  <span>{p}</span>
                  <span style={{ color: '#22c55e', fontSize: '8px', marginTop: '5px', flexShrink: 0 }}>▶</span>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* CENTER WHEEL */}
        <motion.div className="wheel-center" initial={{ opacity: 0, scale: 0.8 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 80 }} style={{ position: 'relative', width: '460px', height: '460px', flexShrink: 0 }}>
          <div className="spinning-outer" style={{ position: 'absolute', top: '50%', left: '50%', width: '120%', height: '120%', borderRadius: '50%', border: '1px dashed rgba(34,197,94,0.15)', animation: 'spinCW 25s linear infinite', pointerEvents: 'none' }} />
          <div className="spinning-inner" style={{ position: 'absolute', top: '50%', left: '50%', width: '135%', height: '135%', borderRadius: '50%', border: '1px dashed rgba(34,197,94,0.08)', animation: 'spinCCW 35s linear infinite', pointerEvents: 'none' }} />
          <WheelSVG activeId={activeId} setActiveId={setActiveId} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '190px', height: '190px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #22c55e', boxShadow: '0 0 0 6px rgba(34,197,94,0.1), 0 0 40px rgba(34,197,94,0.5), 0 0 80px rgba(34,197,94,0.2)', zIndex: 10 }}>
            <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}>
              <source src="/videos/vidcen.mp4" type="video/mp4" />
            </video>
          </div>
        </motion.div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }} onMouseLeave={() => setActiveId(null)}>
          {rightSegments.map((seg, i) => (
            <motion.div
              key={seg.id}
              onMouseEnter={() => setActiveId(seg.id)}
              variants={{
                hidden: { opacity: 0, x: 40 },
                visible: { opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)', scale: 1, transition: { delay: 0.2 + i * 0.15, duration: 0.6 } },
                active: { opacity: 1, x: 0, backgroundColor: 'rgba(34,197,94,0.06)', scale: 1.03, transition: { duration: 0.2 } }
              }}
              initial="hidden"
              animate={isInView ? (activeId === seg.id ? "active" : "visible") : "hidden"}
              style={{
                padding: '24px 20px',
                borderLeft: `2px solid ${activeId === seg.id ? '#22c55e' : 'rgba(34,197,94,0.15)'}`,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border 0.3s ease',
                borderRadius: '0 8px 8px 0',
                position: 'relative',
                transformOrigin: 'left center' }}
            >
              {activeId === seg.id && (
                <motion.div layoutId="activeDotRight" style={{ position: 'absolute', left: '-5.5px', top: '50%', transform: 'translateY(-50%)', width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 15px #22c55e', zIndex: 5 }} />
              )}
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-start', gap: '8px' }}>
                <span style={{ color: 'rgba(34,197,94,0.7)', fontSize: '18px', fontFamily: 'var(--font-anton), sans-serif', letterSpacing: '0.1em' }}>{String(seg.id).padStart(2, '0')}</span>
                <span style={{ color: activeId === seg.id ? '#22c55e' : '#ffffff', fontSize: '20px', fontFamily: 'var(--font-anton), sans-serif', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'color 0.3s ease' }}>{seg.label}</span>
              </div>
              <div style={{ width: '30px', height: '2px', background: '#22c55e', marginBottom: '10px', boxShadow: '0 0 6px #22c55e' }} />
              {seg.points.map((p, pi) => (
                <div key={pi} style={{ color: '#777777', fontSize: '13px', lineHeight: '1.6', marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#22c55e', fontSize: '8px', marginTop: '5px', flexShrink: 0 }}>▶</span>
                  <span>{p}</span>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .wheel-center { transform: scale(0.8) !important; }
          .wheel-layout { gap: 20px !important; }
        }
        @media (max-width: 768px) {
          .wheel-layout { grid-template-columns: 1fr !important; }
          .wheel-center { margin: 40px auto !important; transform: scale(0.7) !important; }
          .spinning-outer, .spinning-inner { display: none !important; }
        }
      `}</style>
    </section>
  );
}
