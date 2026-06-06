"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Instagram, Play, ArrowRight, ExternalLink, X } from "lucide-react";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";


const videos = [
  {
    id: "intro-1",
    src: "/videos/video01.mp4",
    type: 'portrait' as const,
    category: "TRAINING",
    title: "PERFORMANCE ELITE",
    description: "High-intensity athletic conditioning and explosive power development.",
    duration: "0:45"
  },
  {
    id: "intro-2",
    src: "/videos/video02.mp4",
    type: 'portrait' as const,
    category: "PERFORMANCE",
    title: "CORE STABILITY",
    description: "Advanced biomechanical optimization for peak human performance.",
    duration: "1:12"
  },
  {
    id: "intro-3",
    src: "/videos/video03.mp4",
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
      className="absolute rounded-full bg-[#00ff88]/30 blur-[1px]"
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

const CarouselCard = ({ 
  video, 
  position, 
  isActive, 
  onClick 
}: { 
  video: typeof videos[0], 
  position: 'left' | 'center' | 'right', 
  isActive: boolean, 
  onClick: () => void 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && isActive) {
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isHovered, isActive]);

  const getPositionClass = (pos: 'left' | 'center' | 'right') => {
    switch (pos) {
      case 'center':
        return 'left-1/2 -translate-x-1/2 scale-100 sm:scale-105 z-20 opacity-100 border-[#00ff88] shadow-[0_0_50px_rgba(0,255,136,0.35)]';
      case 'left':
        return 'hidden sm:block left-1/2 -translate-x-[115%] lg:-translate-x-[130%] scale-90 z-10 opacity-40 border-zinc-800 hover:border-zinc-700';
      case 'right':
        return 'hidden sm:block left-1/2 translate-x-[15%] lg:translate-x-[30%] scale-90 z-10 opacity-40 border-zinc-800 hover:border-zinc-700';
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`absolute w-[90vw] sm:w-[330px] md:w-[350px] max-w-[350px] aspect-[9/16] rounded-[20px] overflow-hidden transition-all duration-700 ease-out cursor-pointer border bg-[#050505] select-none ${getPositionClass(position)}`}
    >
      {/* Video element */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 to-black">
        <video
          ref={videoRef}
          src={video.src}
          muted
          loop
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-700 ${isHovered && isActive ? 'opacity-100' : 'opacity-30'}`}
        />
      </div>

      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 bg-texture opacity-[0.03] pointer-events-none mix-blend-overlay z-5"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      />

      {/* Dark Dimmed Overlay for non-active cards */}
      {!isActive && (
        <div className="absolute inset-0 bg-black/60 z-10 transition-opacity duration-700" />
      )}

      {/* Category Badge */}
      <span className="absolute top-4 left-4 z-30 px-2.5 py-1 bg-[#00ff88] text-black text-[9px] font-black rounded-sm uppercase tracking-wider font-label">
        {video.category}
      </span>

      {/* Duration */}
      <span className="absolute top-4 right-4 z-30 text-white/80 text-[9px] font-bold uppercase tracking-widest bg-black/60 px-2 py-1 rounded backdrop-blur-sm font-mono">
        {video.duration}
      </span>

      {/* Center Play Button */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center backdrop-blur-sm transition-all duration-300
          ${isActive 
            ? 'border-white text-white bg-white/10 shadow-[0_0_20px_rgba(0,255,136,0.15)] scale-110' 
            : 'border-zinc-800 text-zinc-500 bg-black/40'
          }
        `}>
          <Play className={`ml-1 ${isActive ? 'fill-white' : 'fill-zinc-500'}`} size={18} />
        </div>
      </div>

      {/* Bottom info panel */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6 z-30">
        <h4 className="text-white font-display text-xl md:text-2xl font-black uppercase tracking-tight italic leading-none mb-2 transition-colors duration-300 group-hover:text-[#00ff88]">
          {video.title}
        </h4>
        <p className="text-white/60 text-[10px] md:text-xs font-medium leading-relaxed uppercase tracking-wide font-sans">
          {video.description}
        </p>
      </div>
    </div>
  );
};

export default function Introduction() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [selectedVideo, setSelectedVideo] = useState<typeof videos[0] | null>(null);
  const [activeIndex, setActiveIndex] = useState(1);

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % 3);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + 3) % 3);
  };

  return (
    <section id="introduction" ref={containerRef} className="pt-[120px] pb-[120px] bg-[#0a0a0a] relative z-10 overflow-hidden w-full">

      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => <FloatingParticle key={i} index={i} />)}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="h-px w-12 bg-[#00ff88]"></div>
            <h2 className="text-sm font-black tracking-[0.4em] text-[#00ff88] uppercase font-label">Introduction</h2>
            <div className="h-px w-12 bg-[#00ff88]"></div>
          </div>
          <h3 className="font-display text-5xl md:text-[80px] font-black tracking-tighter text-white uppercase italic leading-none">
            WHO <span className="text-[#00ff88]">WE</span> ARE
          </h3>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative w-full max-w-[1000px] mx-auto h-[520px] sm:h-[600px] mb-8 flex items-center justify-center overflow-visible">
          {videos.map((video, index) => {
            let position: 'left' | 'center' | 'right' = 'center';
            if (index === activeIndex) {
              position = 'center';
            } else if (index === (activeIndex - 1 + 3) % 3) {
              position = 'left';
            } else {
              position = 'right';
            }
            
            return (
              <CarouselCard
                key={video.id}
                video={video}
                position={position}
                isActive={index === activeIndex}
                onClick={() => {
                  if (index === activeIndex) {
                    setSelectedVideo(video);
                  } else {
                    setActiveIndex(index);
                  }
                }}
              />
            );
          })}
        </div>

        {/* Carousel Controls */}
        <div className="flex justify-center items-center gap-6 mb-24 z-20 relative">
          <button 
            onClick={prevCard} 
            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-[#00ff88] hover:text-[#00ff88] transition-all duration-300 bg-black/30 backdrop-blur-sm cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Previous card"
          >
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">
            0{activeIndex + 1} / 03
          </span>
          <button 
            onClick={nextCard} 
            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-[#00ff88] hover:text-[#00ff88] transition-all duration-300 bg-black/30 backdrop-blur-sm cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Next card"
          >
            <ArrowRight size={20} />
          </button>
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
                   className="absolute -top-12 right-0 text-[#00ff88] hover:text-white transition-colors flex items-center gap-2 group p-2 cursor-pointer"
                 >
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
                   <X size={24} />
                 </button>
                 
                 <div className="w-full bg-black rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,255,136,0.15)]">
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
            <h4 className="text-[#00ff88] text-xs font-black tracking-[0.4em] uppercase mb-6 italic font-label">About KIO-X</h4>
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
                   <span className="text-[#00ff88] text-[10px] font-black italic">{stat.accent}</span>
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
              <div className="absolute inset-0 bg-[#00ff88]/20 rounded-full blur-xl group-hover:bg-[#00ff88]/40 transition-all duration-500" />
              <div className="w-20 h-20 rounded-full border border-[#00ff88]/30 flex items-center justify-center bg-black/40 backdrop-blur-md relative z-10 group-hover:border-[#00ff88] transition-colors">
                <Instagram size={32} className="text-[#00ff88] group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div className="flex items-center gap-4 text-white hover:text-[#00ff88] transition-colors">
               <span className="font-display text-2xl md:text-3xl font-black italic tracking-tighter uppercase">@KIOYO.PERFORMANCE</span>
               <div className="w-10 h-10 rounded-full bg-[#00ff88]/10 flex items-center justify-center group-hover:bg-[#00ff88] group-hover:text-black transition-all">
                  <ArrowRight size={18} />
               </div>
            </div>
            <div className="h-0.5 w-12 bg-[#00ff88] transition-all duration-500 group-hover:w-48" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
