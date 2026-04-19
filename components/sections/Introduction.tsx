"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Instagram, Play, ArrowRight, ExternalLink, X } from "lucide-react";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";


const videos = [
  {
    id: "intro-1",
    src: "/v2/video (1).mp4",
    type: 'portrait' as const,
    category: "TRAINING",
    title: "PERFORMANCE ELITE",
    description: "High-intensity athletic conditioning and explosive power development.",
    duration: "0:45"
  },
  {
    id: "intro-2",
    src: "/v2/video (2).mp4",
    type: 'portrait' as const,
    category: "PERFORMANCE",
    title: "CORE STABILITY",
    description: "Advanced biomechanical optimization for peak human performance.",
    duration: "1:12"
  },
  {
    id: "intro-3",
    src: "/v2/video (3).mp4",
    type: 'portrait' as const,
    category: "MINDSET",
    title: "ELITE PROTOCOL",
    description: "Cognitive performance and reaction-time training for top-tier athletes.",
    duration: "0:58"
  }
];

const FloatingParticle = ({ index }: { index: number }) => {
  const [mounted, setMounted] = useState(false);
  const data = useRef({
    size: Math.random() * 6 + 2,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    targetX: Math.random() * 100 - 50,
    targetY: Math.random() * 100 - 50
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  return (
    <motion.div
      className="absolute rounded-full bg-[#22c55e]/30 blur-[1px]"
      style={{
        width: data.current.size,
        height: data.current.size,
        left: `${data.current.initialX}%`,
        top: `${data.current.initialY}%` }}
      animate={{
        x: [0, data.current.targetX, 0],
        y: [0, data.current.targetY, 0],
        opacity: [0.2, 0.5, 0.2] }}
      transition={{
        duration: data.current.duration,
        repeat: Infinity,
        ease: "linear" }}
    />
  );
};

const ThreeDCard = ({ video, position, delay, onClick }: { video: typeof videos[0], position: 'left' | 'center' | 'right', delay: number, onClick: () => void }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window === 'undefined' || !cardRef.current || window.innerWidth < 1024) return;

    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Tilt intensity
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
  };

  useEffect(() => {
    if (isHovered) {
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  const variants = {
    hidden: { 
      opacity: 0, 
      x: position === 'left' ? -100 : position === 'right' ? 100 : 0, 
      y: position === 'center' ? 50 : 0,
      scale: position === 'center' ? 0.8 : 1
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0, 
      scale: 1,
      transition: { duration: 1, delay, ease: "easeOut" as any }
    }
  };

  const getCardStyle = () => {
    if (!isMounted || typeof window === 'undefined') return {};
    if (window.innerWidth < 1024) return {};
    
    switch(position) {
      case 'left': return { transform: 'rotateY(25deg) translateX(-20px) scale(0.85)', opacity: 0.6, zIndex: 10 };
      case 'right': return { transform: 'rotateY(-25deg) translateX(20px) scale(0.85)', opacity: 0.6, zIndex: 10 };
      case 'center': return { transform: 'rotateY(0deg) scale(1)', opacity: 1, zIndex: 20 };
    }
  };

  return (
    <motion.div
      variants={variants}
      className="relative group transition-all duration-700 ease-out"
      style={{ perspective: "1200px" }}
    >
      {/* 3D Card Body */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={`relative w-[340px] md:w-[380px] aspect-[9/16] rounded-[24px] overflow-hidden transition-transform duration-500 will-change-transform cursor-pointer border
          ${position === 'center' ? 'border-[#22c55e] shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'border-[#22c55e]/20'}
        `}
        style={getCardStyle()}
      >
        {/* Video / Thumbnail */}
        <div className="absolute inset-0 bg-[#080808]">
          <video
            ref={videoRef}
            src={video.src}
            muted
            loop
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-40'}`}
          />
        </div>

        {/* Light Sweep Effect Overlay */}
        {(position === 'center' || isHovered) && (
          <div className="absolute inset-0 pointer-events-none opacity-40 z-20 animate-[lightSweep_4s_linear_infinite]" 
               style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(34,197,94,0.4) 50%, transparent 60%)', backgroundSize: '200% auto' }} />
        )}

        {/* Center Play Button (Visible when not hovered) */}
        <AnimatePresence>
          {!isHovered && (
            <motion.div 
               exit={{ opacity: 0, scale: 1.2 }}
               className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
              <div className="w-16 h-16 rounded-full border-2 border-[#22c55e] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[centerPulse_2s_infinite]">
                 <Play className="text-white fill-white ml-1" size={24} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Info Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8 z-30 transition-transform duration-500 group-hover:translate-y-[-10px]">
          <div className="flex items-center gap-2 mb-3">
             <span className="px-2.5 py-0.5 bg-[#22c55e] text-black text-[10px] font-black rounded-sm uppercase tracking-wider">
               {video.category}
             </span>
             <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{video.duration}</span>
          </div>
          <h4 className="text-white font-display text-2xl font-bold uppercase tracking-tight italic leading-none mb-3">
            {video.title}
          </h4>
          <p className="text-white/50 text-xs font-medium leading-relaxed line-clamp-2 uppercase tracking-wide">
            {video.description}
          </p>
        </div>
      </div>

      {/* Reflection Effect */}
      <div 
        className="absolute -bottom-[20%] left-0 right-0 h-1/2 opacity-10 blur-[2px] pointer-events-none hidden lg:block"
        style={{ 
          background: `linear-gradient(to top, transparent, rgba(34,197,94,0.2))`,
          transform: `scaleY(-1) perspective(1200px) ${getCardStyle()?.transform || ''}`,
          maskImage: 'linear-gradient(to bottom, black, transparent)'
        }}
      />
    </motion.div>
  );
};

export default function Introduction() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [selectedVideo, setSelectedVideo] = useState<typeof videos[0] | null>(null);

  return (
    <section id="introduction" ref={containerRef} className="pt-[120px] pb-[120px] bg-[#0a0a0a] relative z-10 overflow-hidden w-full">

      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => <FloatingParticle key={i} index={i} />)}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-24"
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="h-px w-12 bg-[#22c55e]"></div>
            <h2 className="text-sm font-black tracking-[0.4em] text-[#22c55e] uppercase">Introduction</h2>
            <div className="h-px w-12 bg-[#22c55e]"></div>
          </div>
          <h3 className="font-display text-5xl md:text-[80px] font-black tracking-tighter text-white uppercase italic leading-none">
            Who <span className="text-[#22c55e]">We</span> Are
          </h3>
        </motion.div>

        {/* 3D Cards Container */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-0 mb-32 perspective-[1200px]">
          <ThreeDCard video={videos[0]} position="left" delay={0.2} onClick={() => setSelectedVideo(videos[0])} />
          <ThreeDCard video={videos[1]} position="center" delay={0.3} onClick={() => setSelectedVideo(videos[1])} />
          <ThreeDCard video={videos[2]} position="right" delay={0.4} onClick={() => setSelectedVideo(videos[2])} />
        </div>

        {/* Video Player Modal */}
        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8"
            >
              <div className="relative w-full max-w-7xl h-full flex flex-col justify-center">
                 <button 
                   onClick={() => setSelectedVideo(null)}
                   className="absolute -top-12 right-0 text-[#22c55e] hover:text-white transition-colors flex items-center gap-2 group p-2"
                 >
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
                   <X size={24} />
                 </button>
                 
                 <div className="w-full bg-black rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.1)]">
                    <CustomVideoPlayer 
                      src={selectedVideo.src}
                      type={selectedVideo.type}
                      title={selectedVideo.title}
                      category={selectedVideo.category}
                      onBack={() => setSelectedVideo(null)}
                    />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Bottom content: About & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-end border-t border-white/5 pt-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-xl"
          >
            <h4 className="text-[#22c55e] text-xs font-black tracking-[0.4em] uppercase mb-6 italic">About KIO-X</h4>
            <p className="text-white/60 text-lg md:text-xl font-light leading-relaxed tracking-wide uppercase italic">
              KIO-X is at the intersection of <span className="text-white font-bold">Human Performance</span>, biomechanical coaching, and elite athletic development. We don't just train; we optimize every vector of movement.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-8"
          >
            {[
              { label: "Established", value: "2020", accent: "EST." },
              { label: "Location", value: "Berlin", accent: "GERMANY" },
              { label: "Athletes", value: "500+", accent: "ELITE" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">{stat.label}</span>
                <div className="flex items-baseline gap-2">
                   <span className="text-white font-display text-4xl font-black italic tracking-tighter">{stat.value}</span>
                   <span className="text-[#22c55e] text-[10px] font-black italic">{stat.accent}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Instagram Footer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex justify-center mt-24"
        >
          <a 
            href="https://www.instagram.com/kioyo.performance" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#22c55e]/20 rounded-full blur-xl group-hover:bg-[#22c55e]/40 transition-all duration-500" />
              <div className="w-20 h-20 rounded-full border border-[#22c55e]/30 flex items-center justify-center bg-black/40 backdrop-blur-md relative z-10 group-hover:border-[#22c55e] transition-colors">
                <Instagram size={32} className="text-[#22c55e] group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div className="flex items-center gap-4 text-white hover:text-[#22c55e] transition-colors">
               <span className="font-display text-2xl md:text-3xl font-black italic tracking-tighter uppercase">@KIOYO.PERFORMANCE</span>
               <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center group-hover:bg-[#22c55e] group-hover:text-black transition-all">
                  <ArrowRight size={18} />
               </div>
            </div>
            <div className="h-0.5 w-12 bg-[#22c55e] transition-all duration-500 group-hover:w-48" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
