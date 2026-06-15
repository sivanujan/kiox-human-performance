"use client";

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Flame } from 'lucide-react';
import Link from 'next/link';

export default function TrainWithCoach() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const credentials = [
    {
      number: '01',
      title: 'UEFA B Elite Youth License',
      sub: 'Professional Coaching Certification'
    },
    {
      number: '02', 
      title: 'DFB Football-Base Trainer',
      sub: 'U12 & U13 Development Expert'
    },
    {
      number: '03',
      title: 'Multilingual Coach',
      sub: 'German · French · English'
    },
    {
      number: '04',
      title: 'Human Performance Optimizer',
      sub: 'Holistic Athletic Development'
    },
  ];

  return (
    <section 
      ref={ref} 
      id="coach" 
      className="bg-bg-primary transition-colors duration-300 py-24 md:py-32 relative overflow-hidden w-full"
    >
      {/* Background grid pattern & glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0"
          style={{
            opacity: 'var(--grid-opacity)',
            backgroundImage: 'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute left-0 top-1/4 w-[4px] h-[60%] bg-gradient-to-b from-transparent via-accent-green/40 to-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-10 max-w-[1300px] relative z-10">
        {/* SECTION TITLE */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 md:w-16 h-px bg-gradient-to-r from-transparent to-accent-green" />
            <span className="font-label text-xs tracking-[0.4em] text-[#6b9e7a] dark:text-accent-green uppercase font-bold">
              MEET YOUR COACH
            </span>
            <div className="w-12 md:w-16 h-px bg-gradient-to-l from-transparent to-accent-green" />
          </div>
          <h2 className="font-display text-4xl md:text-7xl font-black uppercase leading-none tracking-tight text-text-primary italic">
            TRAIN WITH{' '}
            <span className="text-accent-green">
              FRANCIS KIOYO
            </span>
          </h2>
        </motion.div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT — 3D IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="relative w-full max-w-[500px] mx-auto lg:max-w-none"
          >
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[radial-gradient(circle,_var(--shadow-accent-glow)_0%,_transparent_70%)] blur-[40px] z-0 pointer-events-none" />

            {/* 3D Image card */}
            <motion.div
              whileHover={{ 
                rotateY: 5,
                rotateX: -3,
                scale: 1.02 
              }}
              transition={{ 
                type: 'spring',
                stiffness: 200,
                damping: 20 
              }}
              className="relative rounded-[24px] overflow-hidden z-10 shadow-[0_0_0_1px_var(--border-accent-trans),_0_0_40px_var(--shadow-accent),_0_40px_80px_rgba(0,0,0,0.3)] cursor-default select-none w-full"
            >
              {/* Green gradient border overlay */}
              <div 
                className="absolute inset-0 rounded-[24px] p-0.5 pointer-events-none z-20 opacity-60"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-green), transparent 50%, var(--accent-green))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor'
                }}
              />

              {/* Image */}
              <img
                src="/co.png"
                alt="Francis Kioyo - KIO-X Coach"
                className="w-full h-[400px] sm:h-[500px] lg:h-[620px] object-cover object-top rounded-[24px]"
              />

              {/* Bottom overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent rounded-b-[24px] z-10" />
            </motion.div>

            {/* Corner brackets */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-3 border-l-3 border-accent-green z-20" />
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-3 border-r-3 border-accent-green z-20" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-3 border-l-3 border-accent-green z-20" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-3 border-r-3 border-accent-green z-20" />

            {/* Floating badge — experience */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="absolute bottom-10 -left-3 sm:-left-6 bg-accent-green text-text-on-green px-4 sm:px-6 py-3 rounded-xl text-[10px] sm:text-xs tracking-wider uppercase font-black font-label shadow-[0_10px_40px_var(--shadow-accent-glow)] z-20 whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                <Flame size={12} className="text-text-on-green fill-text-on-green" /> 20+ YEARS EXPERIENCE
              </span>
            </motion.div>

            {/* Floating badge — license */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.7 }}
              className="absolute top-8 -right-3 sm:-right-6 bg-white dark:bg-bg-card border border-[#00a855] dark:border-accent-green text-[#00a855] dark:text-accent-green px-3 sm:px-5 py-3 rounded-xl text-[10px] sm:text-xs tracking-wider font-bold shadow-[0_0_20px_var(--shadow-accent)] z-20 whitespace-nowrap"
            >
              🏆 UEFA B LICENSE
            </motion.div>
          </motion.div>

          {/* RIGHT — CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
            className="flex flex-col w-full"
          >
            {/* Bio */}
            <p className="font-label text-base md:text-lg text-[#2d5a3d] dark:text-text-primary leading-relaxed mb-10 border-l-[3px] border-[#00a855] dark:border-accent-green pl-6">
              Football Engineer, Consultant and Human Performance Optimizer with 20+ years of elite experience. Designing pathways for success by connecting sports performance and education through implementing successful programs.
            </p>

            {/* Credentials */}
            <div className="flex flex-col mb-10">
              {credentials.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ backgroundColor: 'var(--credential-hover-bg)', x: 6 }}
                  className="flex items-center gap-5 py-4 px-4 border-l-2 border-l-transparent border-b border-border-primary/50 rounded-lg cursor-default transition-all duration-300 group hover:border-l-[#00a855] hover:dark:border-l-accent-green"
                >
                  <span className="font-stat text-sm font-black text-[#6b9e7a] dark:text-accent-green/40 min-w-[32px]">{c.number}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_12px_var(--accent-green)] shrink-0" />
                  <div className="flex-1">
                    <div className="font-display text-text-primary text-base sm:text-lg font-bold tracking-wider uppercase mb-0.5">{c.title}</div>
                    <div className="font-label text-text-secondary text-[10px] tracking-widest uppercase font-semibold">{c.sub}</div>
                  </div>
                  <span className="text-[#00a855] dark:text-accent-green text-base opacity-100 dark:opacity-50 transition-transform group-hover:translate-x-1">→</span>
                </motion.div>
              ))}
            </div>

            {/* Stats Box */}
            <div className="flex justify-center mb-10 p-6 bg-bg-card/50 border border-border-primary/50 rounded-2xl w-full">
              <div className="text-center">
                <div className="font-stat text-text-primary text-5xl font-black leading-none tracking-tight drop-shadow-[0_0_30px_var(--shadow-accent-glow)]">15+</div>
                <div className="font-label text-text-primary text-[10px] tracking-[0.4em] uppercase mt-2 font-bold">PROFESSIONAL TEAMS</div>
              </div>
            </div>
            <p className="text-text-secondary text-xs md:text-sm italic text-center -mt-6 mb-10 uppercase tracking-wider">
              Collaborate with over 15 professional teams across Europe
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Link href="/book" className="w-full sm:flex-1">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 40px var(--shadow-accent-glow)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-accent-green text-text-on-green border-none py-5 px-8 rounded text-xs font-black tracking-[0.25em] uppercase cursor-pointer whitespace-nowrap font-label shadow-lg"
                >
                  BOOK TRAINING →
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'var(--shadow-accent)' }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:flex-1 bg-transparent text-accent-green border border-accent-green py-5 px-8 rounded text-xs font-normal tracking-[0.15em] uppercase cursor-pointer whitespace-nowrap font-label"
              >
                VIEW PROFILE
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Brand Text */}
      <div className="font-display absolute -right-16 -bottom-16 text-[250px] sm:text-[400px] text-accent-green/2 font-black leading-none select-none pointer-events-none z-0">
        FK
      </div>
    </section>
  );
}
