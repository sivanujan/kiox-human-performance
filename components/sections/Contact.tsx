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
      icon: <MapPin className="text-[#22c55e] w-6 h-6" />,
      title: "AVAILABLE WORLDWIDE",
      subtitle: (
        <>
          Berlin - Germany<br />
          <span style={{
            color: '#22c55e',
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
    <section id="contact" className="pt-[120px] pb-[120px] bg-[#080808] relative overflow-hidden border-t border-[#22c55e]/20 w-full">
      {/* Background Texture Overlay & Radial Glow */}
      <div className="absolute inset-0 bg-texture opacity-10 pointer-events-none mix-blend-screen mix-blend-luminosity"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full max-h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#22c55e]/10 via-transparent to-transparent opacity-60 pointer-events-none blur-3xl"></div>
      
      <div className="container mx-auto px-4 md:px-10 max-w-[1400px] relative z-10 w-full">
        
        {/* Section Header */}
        <motion.div 
          className="text-center mb-20 md:mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="h-px w-12 bg-[#22c55e]"></div>
            <h2 className="text-sm md:text-base font-medium tracking-[0.3em] text-[#22c55e] uppercase">Get In Touch</h2>
            <div className="h-px w-12 bg-[#22c55e]"></div>
          </div>
          <h3 className="font-display text-5xl md:text-[80px] font-bold tracking-tighter text-white uppercase mb-8 relative inline-block leading-none">
            Connect With Us
          </h3>
          <p className="text-[#a0a0a0] font-sans tracking-widest text-sm md:text-[16px] uppercase max-w-2xl mx-auto">
            Take the first step towards elite performance
          </p>
        </motion.div>

        {/* 2 Column 50/50 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch w-full min-h-[700px]">
          
          {/* LEFT SIDE - CONTACT INFO */}
          <motion.div 
            variants={leftSlide}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col bg-[#111111] border border-[#22c55e]/30 rounded-[24px] p-8 md:p-[60px] h-full shadow-2xl relative overflow-hidden group"
          >
            {/* Subtle background diagonal line pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gold/10 to-transparent opacity-30 transform rotate-45 translate-x-32 -translate-y-32 pointer-events-none"></div>

            <h3 className="font-display text-4xl md:text-[48px] font-bold tracking-tighter text-white uppercase leading-[1.05] mb-6 relative z-10 flex flex-col items-start gap-4">
              <span style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid #22c55e',
                color: '#22c55e',
                padding: '4px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                letterSpacing: '3px',
                fontWeight: 'bold'
              }}>
                LEAGUE 1
              </span>
              <span>
                Let's Build Your<br />
                <span className="text-[#22c55e]">Performance</span>
              </span>
            </h3>
            
            <p className="text-[#a0a0a0] text-[16px] font-sans leading-relaxed mb-10 max-w-md relative z-10 tracking-[0.05em]">
              Join elite athletes from Bundesliga, La Liga and Premier League who trust KIO-X for their performance journey.
            </p>

            <div className="w-full h-[1px] bg-gradient-to-r from-[#22c55e]/50 to-transparent mb-10"></div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col gap-8 flex-1 relative z-10 justify-center"
            >
              {contactInfo.map((item, index) => (
                <motion.div variants={itemVariants} key={index} className="flex items-center gap-6 group/item border-l-4 border-transparent hover:border-gold pl-2 transition-all duration-300">
                  <div className="w-14 h-14 bg-[#1a1a1a] border border-[#22c55e]/30 flex items-center justify-center shrink-0 group-hover/item:border-[#22c55e] group-hover/item:bg-[#22c55e]/10 transition-colors duration-300">
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-white font-bold text-[15px] tracking-[0.1em] uppercase mb-1">{item.title}</h4>
                    <p className="text-[#888888] tracking-wider text-[14px] font-sans">{item.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Social Media Buttons */}
            <div className="flex items-center gap-4 mt-12 relative z-10">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-[#22c55e]/50 flex items-center justify-center text-[#22c55e] hover:bg-[#22c55e] hover:text-black hover:scale-110 transition-all duration-300">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-gold/50 flex items-center justify-center text-gold hover:bg-gold hover:text-black hover:scale-110 transition-all duration-300">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-gold/50 flex items-center justify-center text-gold hover:bg-gold hover:text-black hover:scale-110 transition-all duration-300">
                <Twitter size={20} />
              </a>
            </div>
          </motion.div>

          {/* RIGHT SIDE - FORM */}
          <motion.div 
            variants={rightSlide}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col bg-[#111111] border border-[#22c55e]/40 rounded-[24px] p-8 md:p-[60px] h-full shadow-2xl relative"
          >
            <div className="mb-10 text-center lg:text-left">
              <h4 className="text-[#22c55e] text-sm font-semibold tracking-[0.3em] uppercase">Start Your Journey</h4>
            </div>

            <motion.form 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col gap-8 flex-1"
              onSubmit={(e) => e.preventDefault()}
            >
              
              {/* Full Name */}
              <motion.div variants={itemVariants} className="relative group/input">
                <label className="block text-[#22c55e] text-xs font-semibold tracking-[0.2em] uppercase mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-[#22c55e] transition-colors">
                    <User size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="ENTER YOUR NAME"
                    className="w-full bg-transparent border-b border-[#22c55e]/50 py-3 pl-10 pr-4 text-white placeholder:text-[#555555] focus:outline-none focus:border-[#22c55e] focus:shadow-[0_4px_15px_rgba(34,197,94,0.15)] transition-all tracking-widest text-sm uppercase font-medium"
                  />
                </div>
              </motion.div>

              {/* Email Address */}
              <motion.div variants={itemVariants} className="relative group/input">
                <label className="block text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-gold transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="email" 
                    placeholder="ENTER YOUR EMAIL"
                    className="w-full bg-transparent border-b border-gold/50 py-3 pl-10 pr-4 text-white placeholder:text-[#555555] focus:outline-none focus:border-gold focus:shadow-[0_4px_15px_rgba(34,197,94,0.15)] transition-all tracking-widest text-sm uppercase font-medium"
                  />
                </div>
              </motion.div>

              {/* Phone Number */}
              <motion.div variants={itemVariants} className="relative group/input">
                <label className="block text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-gold transition-colors">
                    <Phone size={20} />
                  </div>
                  <input 
                    type="tel" 
                    placeholder="ENTER YOUR PHONE"
                    className="w-full bg-transparent border-b border-gold/50 py-3 pl-10 pr-4 text-white placeholder:text-[#555555] focus:outline-none focus:border-gold focus:shadow-[0_4px_15px_rgba(34,197,94,0.15)] transition-all tracking-widest text-sm uppercase font-medium"
                  />
                </div>
              </motion.div>

              {/* Message */}
              <motion.div variants={itemVariants} className="relative group/input flex-1">
                <label className="block text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-2">Your Message</label>
                <div className="relative h-full">
                  <div className="absolute left-0 top-3 text-white/40 group-focus-within/input:text-gold transition-colors">
                    <MessageSquare size={20} />
                  </div>
                  <textarea 
                    placeholder="HOW CAN WE HELP YOU?"
                    rows={4}
                    className="w-full bg-transparent border-b border-gold/50 py-3 pl-10 pr-4 text-white placeholder:text-[#555555] focus:outline-none focus:border-gold focus:shadow-[0_4px_15px_rgba(34,197,94,0.15)] transition-all resize-none tracking-widest text-sm uppercase font-medium"
                  ></textarea>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button 
                variants={itemVariants} 
                className="mt-4 w-full bg-[#22c55e] text-black font-extrabold uppercase tracking-[0.2em] py-5 px-8 flex items-center justify-center gap-3 transition-all duration-300 hover:bg-[#4ade80] hover:scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] relative overflow-hidden group/btn"
              >
                {/* CSS Trick Shimmer Sweep Effect */}
                <div className="absolute top-0 -left-[150%] w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[30deg] group-hover/btn:translate-x-[300%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                
                <span className="relative z-10 text-[15px]">Send Message</span>
                <ArrowRight size={20} strokeWidth={2.5} className="relative z-10" />
              </motion.button>

            </motion.form>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
