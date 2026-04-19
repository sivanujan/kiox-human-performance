"use client";

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';


export default function TrainWithCoach() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const credentials = [
    {
      number: '01',
      title: 'UEFA B Elite Youth License',
      sub: 'Professional Coaching Certification' },
    {
      number: '02', 
      title: 'DFB Football-Base Trainer',
      sub: 'U12 & U13 Development Expert' },
    {
      number: '03',
      title: 'Multilingual Coach',
      sub: 'German · French · English' },
    {
      number: '04',
      title: 'Human Performance Optimizer',
      sub: 'Holistic Athletic Development' },
  ];

  return (
    <section ref={ref} id="coach" style={{
      background: '#080808',
      padding: '140px 0',
      position: 'relative',
      overflow: 'hidden' }}>

      {/* SECTION TITLE */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          marginBottom: '80px' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '16px' }}>
          <div style={{
            width: '60px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #22c55e)' }} />
            <span className="font-display" style={{
            color: '#22c55e',
            fontSize: '12px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase' }}>
            MEET YOUR COACH
          </span>
          <div style={{
            width: '60px',
            height: '1px',
            background: 'linear-gradient(90deg, #22c55e, transparent)' }} />
        </div>
        <h2 className="font-display" style={{
          color: '#ffffff',
          fontSize: 'clamp(42px, 6vw, 80px)',
          fontWeight: 900,
          lineHeight: 1,
          margin: 0,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase' }}>
          TRAIN WITH{' '}
          <span style={{ color: '#22c55e' }}>
            FRANCIS KIOYO
          </span>
        </h2>
      </motion.div>

      {/* MAIN CONTENT */}
      <div style={{
        maxWidth: '1300px',
        margin: '0 auto',
        padding: '0 40px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '80px',
        alignItems: 'center' }}>

        {/* LEFT — 3D IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ position: 'relative' }}
        >
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
            zIndex: 0 }} />

          {/* 3D Image card */}
          <motion.div
            whileHover={{ 
              rotateY: 5,
              rotateX: -3,
              scale: 1.02 }}
            transition={{ 
              type: 'spring',
              stiffness: 200,
              damping: 20 }}
            style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              zIndex: 1,
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              boxShadow: `
                0 0 0 1px rgba(34,197,94,0.3),
                0 0 40px rgba(34,197,94,0.2),
                0 0 80px rgba(34,197,94,0.1),
                0 40px 80px rgba(0,0,0,0.5)
              ` }}
          >
            {/* Green gradient border */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '24px',
              padding: '2px',
              background: 'linear-gradient(135deg, #22c55e, transparent 50%, #22c55e)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              zIndex: 2,
              opacity: 0.6 }} />

            {/* Image */}
            <img
              src="/co.png"
              alt="Francis Kioyo - KIO-X Coach"
              style={{
                width: '100%',
                height: '620px',
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block',
                borderRadius: '24px' }}
            />

            {/* Bottom overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              borderRadius: '0 0 24px 24px',
              zIndex: 3 }} />
          </motion.div>

          {/* Corner brackets */}
          {[
            { top: '-8px', left: '-8px', borderTop: '3px solid #22c55e', borderLeft: '3px solid #22c55e' },
            { top: '-8px', right: '-8px', borderTop: '3px solid #22c55e', borderRight: '3px solid #22c55e' },
            { bottom: '-8px', left: '-8px', borderBottom: '3px solid #22c55e', borderLeft: '3px solid #22c55e' },
            { bottom: '-8px', right: '-8px', borderBottom: '3px solid #22c55e', borderRight: '3px solid #22c55e' },
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '24px',
              height: '24px',
              zIndex: 10,
              ...s }} />
          ))}

          {/* Floating badge — experience */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.6 }}
            className="font-display"
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '-30px',
              background: '#22c55e',
              color: '#000000',
              padding: '14px 22px',
              borderRadius: '12px',
              fontSize: '13px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: '0 10px 40px rgba(34,197,94,0.5)',
              zIndex: 10,
              whiteSpace: 'nowrap' }}
          >
            ⚡ 20+ YEARS EXPERIENCE
          </motion.div>

          {/* Floating badge — license */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.7 }}
            className="font-display"
            style={{
              position: 'absolute',
              top: '30px',
              right: '-30px',
              background: 'rgba(0,0,0,0.95)',
              border: '1px solid #22c55e',
              color: '#22c55e',
              padding: '12px 18px',
              borderRadius: '10px',
              fontSize: '12px',
              letterSpacing: '0.1em',
              boxShadow: '0 0 20px rgba(34,197,94,0.2)',
              zIndex: 10,
              whiteSpace: 'nowrap' }}
          >
            🏆 UEFA B LICENSE
          </motion.div>
        </motion.div>

        {/* RIGHT — CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
        >
          {/* Bio */}
          <p className="font-label" style={{
            color: '#eeeeee',
            fontSize: '18px',
            lineHeight: '1.8',
            fontWeight: 500,
            marginBottom: '48px',
            borderLeft: '4px solid #22c55e',
            paddingLeft: '24px' }}>
            Football Engineer, Consultant and Human Performance Optimizer with 20+ years of elite experience. Designing pathways for success by connecting sports performance and education through implementing successful programs.
          </p>

          {/* Credentials */}
          <div style={{ marginBottom: '40px' }}>
            {credentials.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ backgroundColor: 'rgba(34,197,94,0.05)', x: 6 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '18px 16px',
                  borderBottom: '1px solid rgba(34,197,94,0.1)',
                  borderRadius: '8px',
                  cursor: 'default',
                  transition: 'all 0.3s ease' }}
              >
                <span className="font-stat" style={{ color: 'rgba(34,197,94,0.4)', fontSize: '14px', fontWeight: 900, minWidth: '32px' }}>{c.number}</span>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 12px #22c55e', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="font-display" style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '3px', textTransform: 'uppercase' }}>{c.title}</div>
                  <div className="font-label" style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{c.sub}</div>
                </div>
                <span style={{ color: '#22c55e', fontSize: '16px', opacity: 0.5 }}>→</span>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '48px',
            padding: '24px',
            background: 'rgba(34,197,94,0.03)',
            border: '1px solid rgba(34,197,94,0.1)',
            borderRadius: '16px' }}>
            <div style={{ textAlign: 'center', padding: '12px 48px' }}>
              <div className="font-stat" style={{ color: '#22c55e', fontSize: '48px', fontWeight: 900, lineHeight: 1, textShadow: '0 0 30px rgba(34,197,94,0.5)' }}>15+</div>
              <div className="font-label" style={{ color: '#ffffff', fontSize: '12px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: '10px' }}>PROFESSIONAL TEAMS</div>
            </div>
          </div>
          <p style={{
            color: '#888888',
            fontSize: '14px',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '-24px',
            marginBottom: '48px'
          }}>
            Collaborate with over 15 professional teams across Europe
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 10px 40px rgba(34,197,94,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="font-display"
              style={{
                background: '#22c55e',
                color: '#000000',
                border: 'none',
                padding: '20px 48px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap' }}
            >
              BOOK TRAINING →
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, background: 'rgba(34,197,94,0.1)' }}
              whileTap={{ scale: 0.97 }}
              className="font-display"
              style={{
                background: 'transparent',
                color: '#22c55e',
                border: '1px solid #22c55e',
                padding: '20px 48px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 400,
                letterSpacing: '0.15em',
                cursor: 'pointer',
                whiteSpace: 'nowrap' }}
            >
              VIEW PROFILE
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* BG DECORATION */}
      <div className="font-display" style={{ position: 'absolute', right: '-60px', bottom: '-80px', fontSize: '400px', color: 'rgba(34,197,94,0.02)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none', zIndex: 0 }}>
        FK
      </div>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(34,197,94,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, top: '20%', width: '4px', height: '60%', background: 'linear-gradient(180deg, transparent, #22c55e, transparent)', opacity: 0.4 }} />

      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 60px !important;
          }
          div[style*="max-width: 480px"] {
            max-width: 100% !important;
          }
          img[style*="height: 620px"] {
            height: 500px !important;
          }
        }
      `}</style>
    </section>
  );
}
