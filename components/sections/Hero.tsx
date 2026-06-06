"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Typewriter from "@/components/ui/Typewriter";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log("Autoplay blocked:", err));
    }
    
    setParticles(
      Array.from({length: 20}, (_, i) => ({
        id: i,
        // Scale scattering up to cover the large font visually
        tx: (Math.random() * 400 - 200) + 'px', 
        ty: (Math.random() * 200 - 100) + 'px',
        tx2: (Math.random() * 800 - 400) + 'px',
        ty2: (Math.random() * 400 - 200) + 'px',
        size: Math.random() * 80 + 40,
        delay: 0.5 + Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1 }))
    );
  }, []);

  return (
    <section 
      id="home" 
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden w-full cursor-default"
    >
      {/* VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-[#080808]">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
        >
          <source src="/videos/videohero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/80 via-[#080808]/40 to-[#080808] z-10 pointer-events-none" />
      </div>

      {/* SMOKE PARTICLES AT 5S */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
         {particles.map((p) => (
           <div 
             key={p.id}
             className="absolute bg-white/10 rounded-full mix-blend-screen"
             style={{
               width: p.size,
               height: p.size,
               '--tx': p.tx,
               '--ty': p.ty,
               '--tx2': p.tx2,
               '--ty2': p.ty2,
               animation: `smokeParticle ${p.duration}s ease-out ${p.delay}s forwards`,
               opacity: 0
             } as React.CSSProperties}
           />
         ))}
      </div>

      {/* SHOCKWAVE ON IMPACT AT 5S */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
         <div 
           className="absolute border-[3px] border-[#00ff88] rounded-[50%]"
           style={{ animation: 'shockwave 0.8s ease-out 0.5s forwards', opacity: 0 }}
         />
      </div>

      {/* HUD OVERLAY */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: 'linear-gradient(rgba(0,255,136,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        <div className="absolute top-8 left-8 w-16 h-16 border-t-[3px] border-l-[3px] border-[#00ff88]/60"></div>
        <div className="absolute top-8 right-8 w-16 h-16 border-t-[3px] border-r-[3px] border-[#00ff88]/60"></div>
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-[3px] border-l-[3px] border-[#00ff88]/60"></div>
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-[3px] border-r-[3px] border-[#00ff88]/60"></div>
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="container relative z-20 mx-auto px-4 text-center flex flex-col items-center mt-16 md:mt-24 w-full pointer-events-none">
        <div className="flex flex-col items-center w-full">
          <h1 className="font-display font-bold leading-[0.85] tracking-tighter uppercase mb-6 sm:mb-8 text-[7.5vw] xs:text-[9vw] sm:text-[10vw] md:text-[9vw] lg:text-[130px] flex flex-col items-center drop-shadow-2xl">
            
            {/* UNLEASH YOUR - staggered mapped display */}
            <div className="text-white relative z-10 pointer-events-none flex justify-center whitespace-pre pb-2">
              {"UNLEASH YOUR".split('').map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, filter: 'blur(40px)', scale: 1.3 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  transition={{ delay: 0.2 + (i * 0.08), duration: 0.6, ease: 'easeOut' }}
                  className="inline-block text-layer-shadow"
                >
                  {letter === ' ' ? '\u00A0' : letter}
                </motion.span>
              ))}
            </div>

            {/* PERFORMANCE - staggered mapped display with green glow */}
            <div className="relative inline-block flex justify-center whitespace-pre mt-2">
              {"PERFORMANCE".split('').map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, filter: 'blur(30px)', scale: 1.4 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  transition={{ delay: 0.7 + (i * 0.07), duration: 0.8, ease: 'easeOut' }}
                  className="inline-block text-[#00ff88] text-layer-shadow"
                >
                  {letter}
                </motion.span>
              ))}
            </div>
          </h1>

          <div className="text-sm md:text-xl lg:text-2xl text-[#00ff88] font-sans font-medium tracking-[0.2em] uppercase max-w-3xl mx-auto mb-16 text-layer-shadow pointer-events-none">
            <Typewriter text="ELITE HUMAN PERFORMANCE TRAINING" delay={1.5} />
          </div>

          {/* UPGRADED BUTTON - Fades in at 8 seconds */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.8, ease: 'easeOut' }}
            className="relative z-30 pointer-events-auto"
          >
            <Link 
              href="#services"
              className="group relative inline-flex w-full sm:w-auto items-center justify-center px-12 py-5 font-bold tracking-widest text-[#080808] uppercase transition-all duration-300 bg-[#00ff88] hover:scale-[1.05] shadow-[0_0_20px_rgba(0,255,136,0.6)] hover:shadow-[0_0_50px_rgba(0,255,136,0.9)] overflow-hidden rounded-full cursor-pointer"
            >
              <div 
                className="absolute inset-0 bg-transparent opacity-50 group-hover:opacity-100 pointer-events-none mix-blend-screen"
                style={{
                  boxShadow: 'inset 0 0 10px rgba(255,255,255,0.8)',
                  animation: 'borderRun 2s linear infinite',
                  borderRadius: '9999px'
                }}
              />
              <span className="relative z-10 flex items-center gap-3">
                Begin Journey <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform animate-bounce" />
              </span>
              <motion.div 
                className="absolute inset-0 h-full w-full bg-white/30 z-0 origin-center rounded-full"
                whileTap={{ scale: 4, opacity: 1, transition: { duration: 0.4 } }}
              />
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-32 bg-gradient-to-b from-transparent via-[#00ff88]/50 to-[#00ff88] z-20 pointer-events-none"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 128 }}
        transition={{ duration: 1.5, delay: 2.5, ease: "easeInOut" }}
      />
    </section>
  );
}
