"use client";

import { motion } from "framer-motion";

export default function Wellness() {
  return (
    <section className="py-32 md:py-48 bg-bg-primary relative flex items-center justify-center overflow-hidden border-t border-border-primary/50 w-full transition-colors duration-300">
      <div className="absolute inset-0 bg-texture opacity-20 pointer-events-none"></div>
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="container mx-auto px-4 md:px-10 relative z-10">
        <motion.div 
          className="max-w-5xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="inline-flex justify-center items-center gap-6 mb-12">
            <div className="h-px w-20 md:w-32 bg-gradient-to-r from-transparent to-accent-green" />
            <div className="w-2 h-2 rounded-full bg-accent-green" />
            <div className="h-px w-20 md:w-32 bg-gradient-to-l from-transparent to-accent-green" />
          </div>
          
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-text-primary uppercase mb-8 leading-[0.9]">
            Total Wellness <br className="hidden sm:block" />Support
          </h2>
          
          <h3 className="font-sans text-xl md:text-3xl font-light tracking-wide text-text-secondary max-w-3xl mx-auto leading-relaxed border-l-2 border-accent-green pl-6 md:pl-8 text-left italic">
            "Holistic approach addressing <span className="text-accent-green font-medium not-italic">Mind and Body</span> to sustain elite athletic longevity."
          </h3>
        </motion.div>
      </div>
    </section>
  );
}
