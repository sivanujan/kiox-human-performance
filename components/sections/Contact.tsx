"use client";

import { motion } from "framer-motion";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  User, 
  MessageSquare,
  Facebook,
  Twitter,
  ArrowRight
} from "lucide-react";

export default function Contact() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3 } } };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    } };

  const leftSlide = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    } };

  const rightSlide = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    } };

  const contactInfo = [
    {
      icon: <MapPin className="text-[#00ff88] w-6 h-6" />,
      title: "AVAILABLE WORLDWIDE",
      subtitle: (
        <>
          Berlin - Germany<br />
          <span className="font-label font-bold" style={{
            color: '#00ff88',
            fontSize: '13px',
            letterSpacing: '0.1em'
          }}>Worldwide</span>
        </>
      )
    },
    {
      icon: <Phone className="text-gold w-6 h-6" />,
      title: "BOOK A CONSULTATION",
      subtitle: "+XX XXX XXX XXXX"
    },
    {
      icon: <Mail className="text-gold w-6 h-6" />,
      title: "EMAIL US",
      subtitle: "info@kiox.com"
    },
    {
      icon: <Instagram className="text-gold w-6 h-6" />,
      title: "FOLLOW OUR JOURNEY",
      subtitle: "@kioyo.performance"
    }
  ];

  return (
    <section id="contact" className="pt-[72px] pb-[72px] bg-[#080808] relative overflow-hidden border-t border-[#00ff88]/20 w-full">
      {/* Background Texture Overlay & Radial Glow */}
      <div className="absolute inset-0 bg-texture opacity-10 pointer-events-none mix-blend-screen mix-blend-luminosity"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full max-h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff88]/10 via-transparent to-transparent opacity-60 pointer-events-none blur-3xl"></div>
      
      <div className="container mx-auto px-4 md:px-10 max-w-[1400px] relative z-10 w-full">
        
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12 md:mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="h-px w-12 bg-[#00ff88]"></div>
            <h2 className="text-sm md:text-base font-medium tracking-[0.3em] text-[#00ff88] uppercase font-label">Get In Touch</h2>
            <div className="h-px w-12 bg-[#00ff88]"></div>
          </div>
          <h3 className="font-display text-4xl md:text-[64px] font-bold tracking-tighter text-white uppercase mb-5 relative inline-block leading-none italic">
            Connect With Us
          </h3>
          <p className="text-[#a0a0a0] font-sans tracking-widest text-sm md:text-[15px] uppercase max-w-2xl mx-auto">
            Take the first step towards elite performance
          </p>
        </motion.div>

        {/* 2 Column 50/50 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch w-full min-h-[500px]">
          
          {/* LEFT SIDE - CONTACT INFO */}
          <motion.div 
            variants={leftSlide}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col bg-[#111111] border border-[#00ff88]/30 rounded-[20px] p-5 sm:p-6 md:p-9 h-full shadow-2xl relative overflow-hidden group"
          >
            {/* Subtle background diagonal line pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gold/10 to-transparent opacity-30 transform rotate-45 translate-x-32 -translate-y-32 pointer-events-none"></div>

            <h3 className="font-display text-3xl md:text-[40px] font-bold tracking-tighter text-white uppercase leading-[1.05] mb-4 relative z-10 flex flex-col items-start gap-3 italic">
              <span className="font-label font-bold" style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid #00ff88',
                color: '#00ff88',
                padding: '3px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                letterSpacing: '2px'
              }}>
                LEAGUE 1
              </span>
              <span>
                Let's Build Your<br />
                <span className="text-[#00ff88]">Performance</span>
              </span>
            </h3>
            
            <p className="text-[#a0a0a0] text-[15px] font-sans leading-relaxed mb-6 max-w-md relative z-10 tracking-[0.05em]">
              Join elite athletes from Bundesliga, La Liga and Premier League who trust KIO-X for their performance journey.
            </p>

            <div className="w-full h-[1px] bg-gradient-to-r from-[#00ff88]/50 to-transparent mb-6"></div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col gap-5 flex-1 relative z-10 justify-center"
            >
              {contactInfo.map((item, index) => (
                <motion.div variants={itemVariants} key={index} className="flex items-center gap-4 group/item border-l-4 border-transparent hover:border-gold pl-2 transition-all duration-300">
                  <div className="w-10 h-10 bg-[#1a1a1a] border border-[#00ff88]/30 flex items-center justify-center shrink-0 group-hover/item:border-[#00ff88] group-hover/item:bg-[#00ff88]/10 transition-colors duration-300">
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-white font-bold text-[13px] tracking-[0.1em] uppercase mb-0.5 font-label">{item.title}</h4>
                    <div className="text-[#888888] tracking-wider text-[13px] font-sans font-medium">{item.subtitle}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Social Media Buttons */}
            <div className="flex items-center gap-3 mt-6 relative z-10">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-[#00ff88]/50 flex items-center justify-center text-[#00ff88] hover:bg-[#00ff88] hover:text-black hover:scale-110 transition-all duration-300 cursor-pointer">
                <Instagram size={18} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gold/50 flex items-center justify-center text-gold hover:bg-gold hover:text-black hover:scale-110 transition-all duration-300">
                <Facebook size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gold/50 flex items-center justify-center text-gold hover:bg-gold hover:text-black hover:scale-110 transition-all duration-300">
                <Twitter size={18} />
              </a>
            </div>
          </motion.div>

          {/* RIGHT SIDE - FORM */}
          <motion.div 
            variants={rightSlide}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col bg-[#111111] border border-[#00ff88]/40 rounded-[20px] p-5 sm:p-6 md:p-9 h-full shadow-2xl relative"
          >
            <div className="mb-6 text-center lg:text-left">
              <h4 className="text-[#00ff88] text-xs font-semibold tracking-[0.3em] uppercase font-label">Start Your Journey</h4>
            </div>

            <motion.form 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col gap-5 flex-1"
              onSubmit={(e) => e.preventDefault()}
            >
              
              {/* Full Name */}
              <motion.div variants={itemVariants} className="relative group/input">
                <label className="block text-[#00ff88] text-[11px] font-semibold tracking-[0.2em] uppercase mb-1 font-label">Full Name</label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-[#00ff88] transition-colors">
                    <User size={16} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="ENTER YOUR NAME"
                    className="w-full bg-transparent border-b border-[#00ff88]/50 py-2 pl-8 pr-4 text-white placeholder:text-[#555555] focus:outline-none focus:border-[#00ff88] focus:shadow-[0_4px_15px_rgba(0,255,136,0.15)] transition-all tracking-widest text-xs uppercase font-medium font-label"
                  />
                </div>
              </motion.div>

              {/* Email Address */}
              <motion.div variants={itemVariants} className="relative group/input">
                <label className="block text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-gold transition-colors">
                    <Mail size={16} />
                  </div>
                  <input 
                    type="email" 
                    placeholder="ENTER YOUR EMAIL"
                    className="w-full bg-transparent border-b border-gold/50 py-2 pl-8 pr-4 text-white placeholder:text-[#555555] focus:outline-none focus:border-gold focus:shadow-[0_4px_15px_rgba(0,255,136,0.15)] transition-all tracking-widest text-xs uppercase font-medium font-label"
                  />
                </div>
              </motion.div>

              {/* Phone Number */}
              <motion.div variants={itemVariants} className="relative group/input">
                <label className="block text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-1 font-label">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-gold transition-colors">
                    <Phone size={16} />
                  </div>
                  <input 
                    type="tel" 
                    placeholder="ENTER YOUR PHONE"
                    className="w-full bg-transparent border-b border-gold/50 py-2 pl-8 pr-4 text-white placeholder:text-[#555555] focus:outline-none focus:border-gold focus:shadow-[0_4px_15px_rgba(0,255,136,0.15)] transition-all tracking-widest text-xs uppercase font-medium font-label"
                  />
                </div>
              </motion.div>

              {/* Message */}
              <motion.div variants={itemVariants} className="relative group/input flex-1">
                <label className="block text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-1 font-label">Your Message</label>
                <div className="relative h-full">
                  <div className="absolute left-0 top-2 text-white/40 group-focus-within/input:text-gold transition-colors">
                    <MessageSquare size={16} />
                  </div>
                  <textarea 
                    placeholder="HOW CAN WE HELP YOU?"
                    rows={3}
                    className="w-full bg-transparent border-b border-gold/50 py-2 pl-8 pr-4 text-white placeholder:text-[#555555] focus:outline-none focus:border-gold focus:shadow-[0_4px_15px_rgba(0,255,136,0.15)] transition-all resize-none tracking-widest text-xs uppercase font-medium font-label"
                  ></textarea>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button 
                variants={itemVariants} 
                className="mt-2 w-full bg-[#00ff88] text-black font-extrabold uppercase tracking-[0.2em] py-4 px-6 flex items-center justify-center gap-3 transition-all duration-300 hover:bg-[#39ff9c] hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_40px_rgba(0,255,136,0.6)] relative overflow-hidden group/btn cursor-pointer font-label text-base"
              >
                {/* CSS Trick Shimmer Sweep Effect */}
                <div className="absolute top-0 -left-[150%] w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[30deg] group-hover/btn:translate-x-[300%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                
                <span className="relative z-10 text-sm">Send Message</span>
                <ArrowRight size={18} strokeWidth={2.5} className="relative z-10" />
              </motion.button>

            </motion.form>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
