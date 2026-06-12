"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

interface CoachStats {
  yearsExperience: number;
  athletesCount: number;
  certificationsCount: number;
}

interface Coach {
  name: string;
  role: string;
  badge: string;
  image: string;
  specializations: string[];
  stats: CoachStats;
  imageStyle?: React.CSSProperties;
}

const COACHES_DATA: Coach[] = [
  {
    name: "Elena Rostova",
    role: "Elite Strength & Conditioning Coach",
    badge: "PERFORMANCE",
    image: "/coaches/co1.png",
    specializations: [
      "Speed Development",
      "Strength Protocols",
      "Functional Movement"
    ],
    stats: {
      yearsExperience: 8,
      athletesCount: 180,
      certificationsCount: 4,
    }
  },
  {
    name: "Francis Kioyo",
    role: "Head Performance Director",
    badge: "FOUNDER",
    image: "/coaches/co2.png",
    specializations: [
      "UEFA B Elite Youth License",
      "Tactical Engineering",
      "DFB Football-Base Trainer"
    ],
    stats: {
      yearsExperience: 20,
      athletesCount: 500,
      certificationsCount: 4,
    }
  },
  {
    name: "Marcus Vance",
    role: "Lead Athletic Trainer & Physio",
    badge: "RECOVERY",
    image: "/coaches/co3.png",
    specializations: [
      "Injury Prevention",
      "Manual Therapy",
      "Athletic Reconditioning"
    ],
    stats: {
      yearsExperience: 10,
      athletesCount: 220,
      certificationsCount: 5,
    },
    imageStyle: {
      transform: "scale(1.22) translateY(-7%)",
      transformOrigin: "top"
    }
  },
  {
    name: "Lukas Weber",
    role: "Youth Development Coach",
    badge: "DEVELOPMENT",
    image: "/coaches/co4.png",
    specializations: [
      "Junior Performance",
      "Agility Training",
      "Motor Skill Development"
    ],
    stats: {
      yearsExperience: 6,
      athletesCount: 150,
      certificationsCount: 3,
    },
    imageStyle: {
      transform: "scale(1.1) translateY(-2%)",
      transformOrigin: "top"
    }
  },
  {
    name: "Dr. Christian Meier",
    role: "Sports Science & Biomechanics Analyst",
    badge: "SCIENCE",
    image: "/coaches/co5.png",
    specializations: [
      "Biomechanical Analysis",
      "Data Tracking",
      "Physiological Assessment"
    ],
    stats: {
      yearsExperience: 14,
      athletesCount: 310,
      certificationsCount: 7,
    },
    imageStyle: {
      transform: "scale(1.22) translateY(-7%)",
      transformOrigin: "top"
    }
  },
  {
    name: "Jonas Fischer",
    role: "Goalkeeper Performance Specialist",
    badge: "GK EXPERT",
    image: "/coaches/co6.png",
    specializations: [
      "GK Tactical Play",
      "Explosive Reaction",
      "Hand-Eye Coordination"
    ],
    stats: {
      yearsExperience: 5,
      athletesCount: 120,
      certificationsCount: 3,
    },
    imageStyle: {
      transform: "scale(1.1) translateY(-2%)",
      transformOrigin: "top"
    }
  }
];

export default function Coaches() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    }
  };

  return (
    <section 
      id="coaches" 
      ref={containerRef}
      className="py-24 md:py-32 bg-bg-primary transition-colors duration-300 relative overflow-hidden w-full border-t border-border-primary/50"
    >
      {/* Background Grid & Radial Glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10 blur-[120px]" 
          style={{ background: "radial-gradient(circle, var(--accent-green) 0%, transparent 70%)" }}
        />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(var(--border-accent-trans) 1px, transparent 1px), linear-gradient(90deg, var(--border-accent-trans) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-[1400px]">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="h-px w-12 bg-accent-green"></div>
            <h2 className="text-sm font-black tracking-[0.4em] text-accent-green uppercase font-label">KIO-X STAFF</h2>
            <div className="h-px w-12 bg-accent-green"></div>
          </div>
          
          <h3 className="font-display text-5xl md:text-[80px] font-black tracking-tighter text-text-primary uppercase italic leading-none relative inline-block">
            MEET OUR <span className="text-accent-green">COACHES</span>
            <motion.span 
              initial={{ width: 0 }}
              animate={isInView ? { width: "40%" } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-1.5 bg-accent-green"
            />
          </h3>

          <p className="text-text-secondary font-sans text-sm md:text-base max-w-xl mx-auto mt-8 uppercase tracking-wide leading-relaxed font-medium">
            Our industry-leading specialists combine elite sports science, tactical intelligence, and real-world experience to optimize human performance.
          </p>
        </motion.div>

        {/* Coaches Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1200px] mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {COACHES_DATA.map((coach, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                y: -8,
                boxShadow: "0 10px 30px var(--shadow-accent)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative bg-bg-card border border-border-primary/50 rounded-2xl overflow-hidden transition-colors duration-500 hover:border-accent-green flex flex-col h-full"
            >
              {/* Image Section */}
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-bg-secondary flex-shrink-0">
                <div 
                  className="w-full h-full relative"
                  style={coach.imageStyle}
                >
                  <Image
                    src={coach.image}
                    alt={coach.name}
                    fill
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index < 3}
                  />
                </div>
                
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/20 to-transparent z-10" />

                {/* Role Badge */}
                <div className="absolute top-4 left-4 z-20 bg-bg-card/85 backdrop-blur-md text-accent-green border border-accent-green/30 px-2.5 py-1 font-label text-[9px] tracking-widest rounded uppercase font-bold shadow-lg shadow-black/10">
                  {coach.badge}
                </div>
              </div>

              {/* Info Section */}
              <div className="p-5 flex flex-col justify-between flex-grow z-20 relative">
                <div>
                  <h4 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-text-primary mb-0.5 group-hover:text-accent-green transition-colors duration-300">
                    {coach.name}
                  </h4>
                  <p className="font-label text-[10px] md:text-xs tracking-wider text-accent-green font-bold">
                    {coach.role}
                  </p>

                  {/* Specializations */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {coach.specializations.map((spec, sIdx) => (
                      <span 
                        key={sIdx} 
                        className="bg-bg-secondary text-text-secondary border border-border-primary px-2 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase font-semibold transition-all duration-300 group-hover:border-accent-green/20 group-hover:text-text-primary"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  {/* Divider */}
                  <div className="border-t border-border-primary/50 w-full mb-4 group-hover:border-accent-green/20 transition-colors duration-500" />

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="font-stat text-xl md:text-2xl text-text-primary font-black tracking-tight">
                        {coach.stats.yearsExperience}+
                      </div>
                      <div className="font-label text-[8px] text-text-secondary tracking-widest uppercase mt-0.5">
                        YEARS EXP
                      </div>
                    </div>
                    
                    <div className="border-x border-border-primary/50 px-2 group-hover:border-accent-green/20 transition-colors duration-500">
                      <div className="font-stat text-xl md:text-2xl text-text-primary font-black tracking-tight">
                        {coach.stats.athletesCount}+
                      </div>
                      <div className="font-label text-[8px] text-text-secondary tracking-widest uppercase mt-0.5">
                        ATHLETES
                      </div>
                    </div>

                    <div>
                      <div className="font-stat text-xl md:text-2xl text-text-primary font-black tracking-tight">
                        {coach.stats.certificationsCount}
                      </div>
                      <div className="font-label text-[8px] text-text-secondary tracking-widest uppercase mt-0.5">
                        CERTS
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
