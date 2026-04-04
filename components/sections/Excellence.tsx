"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";

const videos = [
  {
    id: "excellence-1",
    src: "/videos/video04.mp4",
    type: 'landscape' as const,
    category: "CARE",
    title: "ELITE RECOVERY",
    description: "Advanced physiological optimization and deep tissue restoration protocols.",
    duration: "1:15"
  },
  {
    id: "excellence-2",
    src: "/videos/video05.mp4",
    type: 'landscape' as const,
    category: "COMMITMENT",
    title: "PERFORMANCE HUB",
    description: "State-of-the-art biomechanical analysis and data-driven training ecosystems.",
    duration: "2:30"
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
        top: `${data.current.initialY}%`,
      }}
      animate={{
        x: [0, data.current.targetX, 0],
        y: [0, data.current.targetY, 0],
        opacity: [0.2, 0.5, 0.2],
      }}
      transition={{
        duration: data.current.duration,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

const ThreeDCard = ({ video, position, delay, onClick }: { video: typeof videos[0], position: 'left' | 'right', delay: number, onClick: () => void }) => {
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
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
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
      x: position === 'left' ? -50 : 50, 
      y: 30
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0, 
      transition: { duration: 0.8, delay, ease: "easeOut" as any }
    }
  };

  const getCardStyle = () => {
    if (!isMounted || typeof window === 'undefined' || window.innerWidth < 1024) return {};
    return { 
      transform: position === 'left' ? 'rotateY(10deg)' : 'rotateY(-10deg)', 
      zIndex: 10 
    };
  };

  return (
    <motion.div
      variants={variants}
      className="relative group w-full"
      style={{ perspective: "1200px" }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className="relative w-full aspect-video md:h-[450px] rounded-[24px] overflow-hidden transition-transform duration-500 will-change-transform cursor-pointer border border-[#22c55e]/20 group-hover:border-[#22c55e]/50"
        style={getCardStyle()}
      >
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

        {isHovered && (
          <div className="absolute inset-0 pointer-events-none opacity-30 z-20 animate-[lightSweep_4s_linear_infinite]" 
               style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(34,197,94,0.4) 50%, transparent 60%)', backgroundSize: '200% auto' }} />
        )}

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

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8 z-30">
          <div className="flex items-center gap-2 mb-3">
             <span className="px-2.5 py-0.5 bg-[#22c55e] text-black text-[10px] font-black rounded-sm uppercase tracking-wider">
               {video.category}
             </span>
             <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{video.duration}</span>
          </div>
          <h4 className="text-white font-display text-2xl md:text-3xl font-bold uppercase tracking-tight italic leading-none mb-3">
            {video.title}
          </h4>
          <p className="text-white/50 text-xs md:text-sm font-medium leading-relaxed max-w-md uppercase tracking-wide">
            {video.description}
          </p>
        </div>
      </div>

      <div 
        className="absolute -bottom-[15%] left-0 right-0 h-1/2 opacity-10 blur-[2px] pointer-events-none hidden lg:block"
        style={{ 
          background: `linear-gradient(to top, transparent, rgba(34,197,94,0.2))`,
          transform: `scaleY(-1) perspective(1200px) ${getCardStyle()?.transform || ''}`,
          maskImage: 'linear-gradient(to bottom, black, transparent)'
        }}
      />
    </motion.div>
  );
};

export default function Excellence() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [selectedVideo, setSelectedVideo] = useState<typeof videos[0] | null>(null);

  return (
    <section id="excellence" ref={containerRef} className="pt-[160px] pb-[160px] bg-[#080808] relative z-10 overflow-hidden w-full">
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(15)].map((_, i) => <FloatingParticle key={i} index={i} />)}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-24"
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="h-px w-12 bg-[#22c55e]"></div>
            <h2 className="text-sm font-black tracking-[0.4em] text-[#22c55e] uppercase">Excellence In Care</h2>
            <div className="h-px w-12 bg-[#22c55e]"></div>
          </div>
          <h3 className="font-display text-5xl md:text-[80px] font-black tracking-tighter text-white uppercase italic leading-none relative inline-block">
            Our <span className="text-[#22c55e]">Commitment</span> To You
            <motion.span 
              initial={{ width: 0 }}
              animate={isInView ? { width: '40%' } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute -bottom-4 left-0 h-1.5 bg-[#22c55e]"
            />
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-[1400px] mx-auto perspective-[1200px]">
          <ThreeDCard video={videos[0]} position="left" delay={0.2} onClick={() => setSelectedVideo(videos[0])} />
          <ThreeDCard video={videos[1]} position="right" delay={0.4} onClick={() => setSelectedVideo(videos[1])} />
        </div>

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
      </div>
    </section>
  );
}
