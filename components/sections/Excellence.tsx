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
      className="absolute rounded-full bg-accent-green/20 blur-[1px]"
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

const CommitmentCard = ({ 
  video, 
  onClick 
}: { 
  video: typeof videos[0], 
  onClick: () => void 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered) {
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="group relative w-full bg-bg-card border border-border-card rounded-[16px] overflow-hidden transition-all duration-500 hover:border-border-active hover:shadow-lg flex flex-col cursor-pointer"
    >
      {/* Video Thumbnail Section */}
      <div className="relative w-full aspect-video overflow-hidden bg-zinc-950 flex-shrink-0">
        <video
          ref={videoRef}
          src={video.src}
          muted
          loop
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-45'}`}
        />

        {/* Hover Dark Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        {/* Light Sweep on Hover */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none opacity-30 z-20 animate-[lightSweep_4s_linear_infinite]" 
               style={{ background: 'linear-gradient(105deg, transparent 40%, var(--accent-green) 50%, transparent 60%)', backgroundSize: '200% auto' }} />
        )}

        {/* Centered Play Button with green border */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-14 h-14 rounded-full border-2 border-accent-green flex items-center justify-center bg-black/40 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Play className="text-white fill-white ml-1" size={18} />
          </div>
        </div>

        {/* Category Badge & Duration (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
          <span className="px-2.5 py-0.5 bg-bg-button-primary text-text-on-green text-[9px] font-black rounded-sm uppercase tracking-wider font-label">
            {video.category}
          </span>
          <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest font-mono">
            {video.duration}
          </span>
        </div>
      </div>

      {/* Content Section below video thumbnail */}
      <div className="p-5 md:p-6 flex flex-col justify-between flex-grow bg-gradient-to-b from-bg-card to-bg-secondary">
        <div>
          <h4 className="text-text-primary font-display text-xl md:text-2xl font-black uppercase italic tracking-tight mb-2 group-hover:text-accent-green transition-colors duration-300">
            {video.title}
          </h4>
          <p 
            className="text-text-secondary text-xs md:text-sm font-medium tracking-wider leading-relaxed"
            style={{ fontVariant: 'all-small-caps' }}
          >
            {video.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Excellence() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [selectedVideo, setSelectedVideo] = useState<typeof videos[0] | null>(null);

  return (
    <section id="excellence" ref={containerRef} className="pt-[140px] pb-[140px] bg-bg-primary relative z-10 overflow-hidden w-full transition-colors duration-300">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(15)].map((_, i) => <FloatingParticle key={i} index={i} />)}
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
            <div className="h-px w-12 bg-accent-green"></div>
            <h2 className="text-sm font-black tracking-[0.4em] text-accent-green uppercase font-label">EXCELLENCE IN CARE</h2>
            <div className="h-px w-12 bg-accent-green"></div>
          </div>
          <h3 className="font-display text-5xl md:text-[80px] font-black tracking-tighter text-text-primary uppercase italic leading-none relative inline-block">
            OUR <span className="text-accent-green">COMMITMENT</span> TO YOU
            <motion.span 
              initial={{ width: 0 }}
              animate={isInView ? { width: '40%' } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-1.5 bg-accent-green"
            />
          </h3>
        </motion.div>

        {/* 50/50 Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1200px] mx-auto">
          <CommitmentCard video={videos[0]} onClick={() => setSelectedVideo(videos[0])} />
          <CommitmentCard video={videos[1]} onClick={() => setSelectedVideo(videos[1])} />
        </div>

        {/* Modal Video Player */}
        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-md"
              style={{ backgroundColor: "var(--backdrop-overlay)" }}
            >
              <div className="relative w-full max-w-7xl h-full flex flex-col justify-center">
                 <button 
                   onClick={() => setSelectedVideo(null)}
                   className="absolute -top-12 right-0 text-accent-green hover:text-text-primary transition-colors flex items-center gap-2 group p-2 bg-transparent border-none cursor-pointer"
                 >
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
                   <X size={24} />
                 </button>
                 
                 <div className="w-full bg-[#000] rounded-2xl overflow-hidden shadow-2xl">
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
