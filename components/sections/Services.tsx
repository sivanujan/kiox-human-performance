"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

const ServiceCard = ({ service, itemVariants }: { service: any, itemVariants: any }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnd = () => {
    if (currentVideo < service.videos.length - 1) {
      setCurrentVideo(prev => prev + 1);
    } else {
      setCurrentVideo(0);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
  }, [currentVideo, isHovered]);

  return (
    <>
      <motion.div 
        variants={itemVariants}
        className="group relative overflow-hidden bg-[#111111] border border-white/10 rounded-[20px] p-[24px] h-full flex flex-col items-center text-center cursor-default z-0 min-h-[380px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentVideo(0); // Reset playlist on leave
        }}
      >
        {/* Background video on hover */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ease-in-out"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          {isHovered && (
            <video
              ref={videoRef}
              src={service.videos[currentVideo]}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Dark overlay */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ease-in-out"
          style={{ 
            opacity: isHovered ? 1 : 0,
            background: 'rgba(0,0,0,0.6)'
          }}
        />

        {/* Green Bottom Border Trick on Hover */}
        <div className="absolute bottom-0 left-0 w-full h-[4px] bg-[#22c55e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-none z-30" />

        {/* Card content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full relative z-20">
          {/* Direct Icon Image */}
          <Image
            src={service.icon}
            alt={service.title}
            width={180}
            height={180}
            style={{ height: 'auto' }}
            className="object-contain mb-6 transition-transform duration-300 group-hover:scale-[1.05] shrink-0"
            unoptimized={true}
          />

          {/* Service Title */}
          <h4 className="text-white font-bold text-[18px] tracking-[0.1em] uppercase mt-2 mb-2 leading-[1.2] transition-transform duration-300 group-hover:-translate-y-2">
            {service.title}
          </h4>

          {/* Description */}
          <p className="text-[#888888] text-[14px] leading-[1.6] mt-2 font-sans font-medium mb-4 transition-transform duration-300 group-hover:-translate-y-2">
            {service.desc}
          </p>

          <div className="mt-auto z-30">
            {/* View More Button */}
            <button
              onClick={() => setShowModal(true)}
              className="text-[#22c55e] border border-[#22c55e] rounded-full px-5 py-2 text-[12px] tracking-widest font-bold uppercase hover:bg-[#22c55e]/10 bg-black/40 backdrop-blur-sm transition-colors duration-300"
              style={{ 
                padding: service.title === 'Games' ? '8px 16px' : '8px 20px', 
                letterSpacing: service.title === 'Games' ? '2px' : '2px',
                fontSize: service.title === 'Games' ? '11px' : '12px',
                whiteSpace: service.title === 'Games' ? 'nowrap' : 'normal'
              }}
            >
              {service.title === 'Games' ? '▶ MATCH DAY' : '▶ VIEW TRAINING'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* POPUP MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111] rounded-[24px] border border-[#22c55e30] p-6 md:p-[32px] w-full max-w-[900px] relative max-h-[90vh] overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#22c55e #111'
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-[16px] right-[16px] bg-transparent border border-[#22c55e] text-[#22c55e] rounded-full w-[36px] h-[36px] flex items-center justify-center cursor-pointer text-[16px] hover:bg-[#22c55e]/10 transition-colors z-[1010]"
              >
                ✕
              </button>

              {/* Modal title */}
              <h3 className="text-[#22c55e] text-[24px] md:text-[32px] font-bold tracking-[4px] uppercase mb-[24px]">
                {service.title}
              </h3>

              {/* Videos grid based on count */}
              <div className="w-full flex-shrink-0 flex flex-col gap-4">
                {service.videos.length === 1 && (
                  <video
                    autoPlay
                    controls
                    playsInline
                    className="w-full object-cover rounded-[16px] border border-[#22c55e40] bg-black"
                    style={{ height: '500px' }}
                  >
                    <source src={service.videos[0]} type="video/mp4" />
                  </video>
                )}

                {service.videos.length === 2 && (
                  <div className="flex flex-col md:flex-row gap-4 w-full">
                    <video autoPlay controls playsInline className="w-full md:w-1/2 object-cover rounded-[16px] border border-[#22c55e40] bg-black" style={{ height: '400px' }}>
                      <source src={service.videos[0]} type="video/mp4" />
                    </video>
                    <video controls playsInline className="w-full md:w-1/2 object-cover rounded-[16px] border border-[#22c55e40] bg-black" style={{ height: '400px' }}>
                      <source src={service.videos[1]} type="video/mp4" />
                    </video>
                  </div>
                )}

                {service.videos.length === 3 && (
                  <div className="flex flex-col gap-4 w-full">
                    <video autoPlay controls playsInline className="w-full object-cover rounded-[16px] border border-[#22c55e40] bg-black" style={{ height: '400px' }}>
                      <source src={service.videos[0]} type="video/mp4" />
                    </video>
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <video controls playsInline className="w-full md:w-1/2 object-cover rounded-[16px] border border-[#22c55e40] bg-black" style={{ height: '300px' }}>
                        <source src={service.videos[1]} type="video/mp4" />
                      </video>
                      <video controls playsInline className="w-full md:w-1/2 object-cover rounded-[16px] border border-[#22c55e40] bg-black" style={{ height: '300px' }}>
                        <source src={service.videos[2]} type="video/mp4" />
                      </video>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default function Services() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2 } } };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    } };

  const services = [
    {
      title: "Legs - Speed",
      icon: "/service/Legs_Speed.png",
      desc: "Explosive leg power and speed development for peak athletic performance.",
      videos: ["/videos/legspeed.mp4"]
    },
    {
      title: "Goalkeeper",
      icon: "/service/Goalkeeper.png",
      desc: "Specialized training programs designed for elite goalkeeper performance.",
      videos: ["/videos/goalkeeper.mp4"]
    },
    {
      title: "Functional",
      icon: "/service/Functional.png",
      desc: "Functional movement patterns to enhance athletic and daily performance.",
      videos: [
        "/videos/Functional.mp4",
        "/videos/Functional02.mp4"
      ]
    },
    {
      title: "Technique",
      icon: "/service/Technique.png",
      desc: "Precision technique refinement for sport-specific movement mastery.",
      videos: ["/videos/Technique.mp4"]
    },
    {
      title: "Games",
      icon: "/service/Games.png",
      desc: "Real game situation training for competitive performance excellence.",
      videos: [
        "/videos/Games01.mp4",
        "/videos/Games02.mp4",
        "/videos/Games03.mp4"
      ]
    },
  ];

  return (
    <section id="services" className="pt-[120px] pb-[120px] bg-[#080808] relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-texture opacity-10 pointer-events-none mix-blend-luminosity"></div>
      
      <div className="container mx-auto px-4 md:px-10 max-w-[1400px] relative z-10">
        
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="h-px w-12 bg-[#22c55e]"></div>
            <h2 className="text-sm md:text-base font-medium tracking-[0.3em] text-[#22c55e] uppercase">Elite Services</h2>
            <div className="h-px w-12 bg-[#22c55e]"></div>
          </div>
          <h3 className="font-display text-5xl md:text-[80px] font-bold tracking-tighter text-white uppercase mb-8 relative inline-block leading-none">
            How We Train
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-[#22c55e]"></span>
          </h3>
        </motion.div>

        {/* Services Grid Layout */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 items-stretch w-full"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {services.map((service, index) => (
            <ServiceCard key={index} service={service} itemVariants={itemVariants} />
          ))}
        </motion.div>

      </div>
    </section>
  );
}
