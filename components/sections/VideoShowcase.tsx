"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, X, ArrowLeft, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { allVideos, VideoMetadata } from "@/lib/videoData";


const TABS = ['ALL', 'TRAINING', 'GAMES', 'LA'];


const VideoCard = ({ video, isActive, onClick, index, inView }: { video: VideoMetadata, isActive: boolean, onClick: () => void, index: number, inView: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(() => {});
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50 }}
      animate={inView ? { 
        opacity: isActive ? 1 : 0.7, 
        scale: isActive ? 1 : 0.95,
        x: 0,
        transition: {
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 },
          x: { delay: index * 0.1, duration: 0.5, ease: "easeOut" }
        }
      } : {}}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative shrink-0 w-[240px] md:w-[280px] aspect-[9/16] rounded-[16px] overflow-hidden cursor-pointer transition-all duration-500 snap-center group border ${
        isActive 
          ? 'border-accent-green shadow-[0_0_20px_var(--shadow-accent-glow)] animate-[glowPulse_2s_infinite]' 
          : 'border-border-primary/50 hover:border-accent-green/50'
      }`}
    >
      <div className="absolute inset-0 bg-bg-secondary">
        {/* Thumbnail Image Placeholder (First frame) */}
        <video 
          ref={videoRef}
          src={video.src}
          muted
          loop
          playsInline
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0.6 }}
        />
      </div>

      {/* Badges */}
      <div className="absolute top-4 left-4 z-20">
        <span className="px-2 py-1 bg-accent-green text-text-on-green text-[10px] font-bold rounded-sm tracking-widest font-label">
          {video.category}
        </span>
      </div>
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-1 px-2 py-1 bg-bg-card/75 backdrop-blur-md rounded-sm border border-border-primary/50 text-text-primary text-[10px] font-medium font-label">
          <Clock size={10} className="text-accent-green" />
          {video.duration}
        </div>
      </div>

      {/* Overlay */}
      <div className={`absolute inset-0 z-10 transition-all duration-500 ${isHovered ? 'bg-black/20' : 'bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80'}`} />

      {/* Center Play Button Overlay */}
      <AnimatePresence>
        {isHovered && isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-accent-green/30 rounded-full blur-xl animate-pulse" />
              <div className="w-16 h-16 rounded-full border-2 border-accent-green flex items-center justify-center bg-bg-card/40 backdrop-blur-sm animate-[playPulse_2s_infinite]">
                 <Play className="text-text-primary fill-text-primary ml-1" size={24} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </motion.div>
  );
};

export default function VideoShowcase() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [filteredVideos, setFilteredVideos] = useState<VideoMetadata[]>(allVideos);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalVideo, setActiveModalVideo] = useState<VideoMetadata | null>(null);
  const [isMobile, setIsMobile] = useState(false);


  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollRaf = useRef<number | null>(null);

  const handleScroll = () => {
    if (scrollRaf.current) return;
    
    scrollRaf.current = requestAnimationFrame(() => {
      if (!scrollRef.current) {
        scrollRaf.current = null;
        return;
      }
      const container = scrollRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      
      let closestIndex = 0;
      let minDistance = Infinity;

      Array.from(container.children).forEach((child, index) => {
        const rect = (child as HTMLElement).getBoundingClientRect();
        const childCenter = rect.left + rect.width / 2;
        const distance = Math.abs(childCenter - containerCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== activeIndex && closestIndex >= 0 && closestIndex < filteredVideos.length) {
        setActiveIndex(closestIndex);
      }
      
      scrollRaf.current = null;
    });
  };


  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const targetChild = children[index];
    if (!targetChild) return;

    const containerWidth = container.clientWidth;
    const childWidth = targetChild.clientWidth;
    const childLeft = targetChild.offsetLeft;
    
    const targetScrollLeft = childLeft - (containerWidth / 2) + (childWidth / 2);
    
    container.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    let filtered = allVideos;
    if (activeTab === 'TRAINING') {
      filtered = allVideos.filter((v: VideoMetadata) => v.category === 'TRAINING');
    } else if (activeTab === 'GAMES') {
      filtered = allVideos.filter((v: VideoMetadata) => v.category === 'GAMES');
    } else if (activeTab === 'LA') {
      filtered = allVideos.filter((v: VideoMetadata) => v.category === 'LA');
    }
    setFilteredVideos(filtered);
  }, [activeTab]);

  useEffect(() => {
    if (scrollRef.current) {
      const targetIndex = filteredVideos.length >= 5 ? 2 : Math.floor(filteredVideos.length / 2);
      setActiveIndex(targetIndex);
      
      const timer = setTimeout(() => {
        scrollToIndex(targetIndex);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [filteredVideos]);

  return (
    <>
      <section ref={sectionRef} className="bg-bg-primary transition-colors duration-300 py-24 relative overflow-hidden w-full pb-32" id="training">
        <div className="container mx-auto px-4 w-full relative z-10">
          
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={isSectionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-accent-green tracking-[0.4em] uppercase text-xs font-bold mb-4 block font-label">Our Training</span>
            <h2 className="text-4xl md:text-7xl font-display font-black text-text-primary uppercase leading-none mb-10 italic">
              Excellence In <span className="text-accent-green">Motion</span>
            </h2>
          </motion.div>

          {/* Filtering System */}
          <div className="relative mb-16 max-w-2xl mx-auto flex justify-center">
            <div className="flex items-center gap-2 md:gap-4 p-1 bg-bg-card rounded-full border border-border-primary/50 relative">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-6 md:px-10 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors duration-300 font-label ${
                    activeTab === tab ? 'text-text-on-green' : 'text-text-secondary hover:text-accent-green'
                  }`}
                >
                  <span className="relative z-10">{tab}</span>
                  
                  {/* Sliding Underline/Pill Background */}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute inset-0 bg-accent-green rounded-full z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Dot indicator above active tab (Subtle) */}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTabDot"
                      className="absolute -top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_10px_var(--accent-green)] z-20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Scroll Area */}
          <div className="relative group w-full">
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-20 px-[calc(50%-120px)] md:px-[calc(50%-140px)] relative"
            >
              <AnimatePresence mode="popLayout">
                {filteredVideos.map((video, index) => (
                  <VideoCard 
                    key={video.src} 
                    video={video} 
                    isActive={index === activeIndex}
                    index={index}
                    inView={isSectionInView}
                    onClick={() => {
                        if (index === activeIndex) {
                          router.push(`/video/${video.id}`);
                        } else {
                          scrollToIndex(index);
                        }
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-bg-card/85 border border-border-primary text-accent-green flex items-center justify-center hover:bg-accent-green hover:text-text-on-green transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex cursor-pointer animate-none"
            >
              <ChevronLeft size={30} />
            </button>
            <button 
              onClick={() => scrollToIndex(Math.min(filteredVideos.length - 1, activeIndex + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-bg-card/85 border border-border-primary text-accent-green flex items-center justify-center hover:bg-accent-green hover:text-text-on-green transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex cursor-pointer animate-none"
            >
              <ChevronRight size={30} />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-3 mt-12">
            {Array.from({ length: Math.min(filteredVideos.length, 5) }).map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  width: (activeIndex % 5) === i ? 24 : 8,
                  backgroundColor: (activeIndex % 5) === i ? 'var(--accent-green)' : 'var(--border-primary)'
                }}
                className="h-2 rounded-full cursor-pointer"
                onClick={() => scrollToIndex(i)}
              />
            ))}
          </div>

          {/* BROWSE ALL BUTTON */}
          <div className="flex justify-center mt-20">
            <button 
              onClick={() => router.push('/gallery')}
              className="group relative inline-flex items-center justify-center px-10 py-4 font-bold tracking-widest text-accent-green uppercase transition-all duration-300 border border-accent-green/50 hover:bg-accent-green hover:text-text-on-green rounded-sm font-label cursor-pointer"
            >
              View Gallery
              <ArrowLeft className="rotate-180 ml-2 group-hover:translate-x-1 transition-transform" size={18} />
            </button>
          </div>

        </div>
      </section>

      {/* MODAL IS THE SAME AS PER REQUIREMENTS (kept from previous implementation) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[100] bg-bg-primary/95 backdrop-blur-3xl flex flex-col pt-4 md:pt-10 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 md:px-12 pb-6 border-b border-border-primary/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                {activeModalVideo && (
                  <button 
                    onClick={() => setActiveModalVideo(null)}
                    className="flex items-center gap-2 text-accent-green hover:text-text-primary transition-colors uppercase tracking-widest text-sm font-bold font-label cursor-pointer"
                  >
                    <ArrowLeft size={20} /> Library
                  </button>
                )}
                {!activeModalVideo && (
                  <h3 className="text-text-primary font-display font-bold text-2xl md:text-4xl uppercase tracking-wider italic">
                    Video <span className="text-accent-green">Grid</span>
                  </h3>
                )}
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setTimeout(() => setActiveModalVideo(null), 300);
                }}
                className="w-10 h-10 rounded-full bg-bg-card border border-border-primary/50 hover:bg-accent-green text-text-primary hover:text-text-on-green flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 no-scrollbar">
              {activeModalVideo ? (
                <div className="w-full h-full max-w-6xl mx-auto flex flex-col pt-4 pb-20">
                  <button 
                    onClick={() => setActiveModalVideo(null)}
                    className="self-start mb-6 flex items-center gap-2 px-6 py-2 bg-accent-green/10 border border-accent-green/50 text-accent-green rounded-full hover:bg-accent-green hover:text-text-on-green transition-all font-bold uppercase tracking-widest text-sm font-label cursor-pointer"
                  >
                    <ArrowLeft size={18} /> Back To Gallery
                  </button>
                  <div className="w-full flex-1 flex items-center justify-center min-h-0">
                    <video 
                      src={activeModalVideo.src}
                      autoPlay
                      controls
                      playsInline
                      className={`rounded-2xl shadow-[0_0_50px_var(--shadow-accent-glow)] bg-bg-card border border-accent-green/30 ${activeModalVideo.type === 'portrait' ? 'h-full max-h-[75vh] max-w-[90vw] object-contain' : 'w-full max-h-[75vh] object-contain'}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[1400px] mx-auto flex flex-col pb-32">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="self-start mb-6 flex items-center gap-2 px-6 py-2 bg-bg-card border border-border-primary/50 text-text-secondary rounded-full hover:bg-bg-secondary hover:text-text-primary hover:border-border-active transition-all font-bold uppercase tracking-widest text-sm font-label cursor-pointer"
                  >
                    <ArrowLeft size={18} /> Back To Home
                  </button>
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8 w-full">
                    {filteredVideos.map((video: VideoMetadata, idx: number) => (
                      <div key={idx} onClick={() => router.push(`/video/${video.id}`)} className="group flex flex-col gap-3 cursor-pointer">
                        <div className={`relative w-full rounded-xl overflow-hidden bg-bg-secondary border border-border-primary group-hover:border-accent-green transition-colors ${video.type === 'portrait' ? 'aspect-[9/16]' : 'aspect-video'}`}>
                          <video src={video.src} muted playsInline className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="text-accent-green fill-accent-green" size={30} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
