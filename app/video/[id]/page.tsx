"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Clock, Share2, Heart, MessageCircle } from 'lucide-react';
import CustomVideoPlayer from '@/components/ui/CustomVideoPlayer';
import { getVideoById, allVideos, VideoMetadata } from '@/lib/videoData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function VideoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<VideoMetadata[]>([]);

  useEffect(() => {
    const v = getVideoById(id as string);
    if (v) {
      setVideo(v);
      setRelatedVideos(allVideos.filter(item => item.id !== id).slice(0, 5));
    } else {
      router.push('/');
    }
  }, [id, router]);

  if (!video) return <div className="min-h-screen bg-black flex items-center justify-center text-[#22c55e] font-bold tracking-widest animate-pulse uppercase">Initializing Player...</div>;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />
      
      {/* 100vw Full Width Player Container */}
      <div className="w-full bg-black pt-[72px]">
        <CustomVideoPlayer 
          src={video.src} 
          type={video.type}
          title={video.title} 
          category={video.category}
          onBack={() => router.back()}
        />
      </div>

      {/* Below Video Section */}
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Side (60%) */}
          <div className="lg:w-[65%] flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/40 text-[#22c55e] text-[10px] font-black rounded-sm uppercase tracking-widest">
                  {video.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-white/40 font-bold uppercase tracking-widest">
                  <Clock size={12} className="text-[#22c55e]" />
                  {video.duration}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase leading-tight italic">
                {video.title}
              </h1>
            </div>

            <div className="flex items-center justify-between py-6 border-y border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#22c55e] flex items-center justify-center text-black font-black text-xl italic shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  KX
                </div>
                <div>
                  <h4 className="text-white font-bold tracking-widest text-lg uppercase">KIO-X Performance</h4>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">High Performance Elite Training</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-white/50 hover:text-[#22c55e] transition-colors">
                  <Heart size={20} />
                  <span className="text-sm font-bold">1.2K</span>
                </button>
                <button className="flex items-center gap-2 text-white/50 hover:text-[#22c55e] transition-colors">
                  <Share2 size={20} />
                  <span className="text-sm font-bold uppercase tracking-widest">Share</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
               <h3 className="text-[#22c55e] font-bold tracking-[0.3em] uppercase text-xs">Overview</h3>
               <p className="text-white/60 leading-relaxed text-lg font-light tracking-wide max-w-4xl">
                 {video.description} This vertical-specific training module focuses on plyometric explosive power, ground-reaction force optimization, and core rotational stability as part of the KIO-X Human Performance protocol.
               </p>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                  {[
                    { label: 'Intensity', value: 'Level 4' },
                    { label: 'Protocal', value: 'Elite' },
                    { label: 'Focus', value: 'Agility' },
                    { label: 'Coach', value: 'Team KIO-X' }
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-white/5 border-l-2 border-[#22c55e] rounded-r-md">
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">{stat.label}</p>
                      <p className="text-white font-bold tracking-wider">{stat.value}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Right Side (More Videos) */}
          <div className="lg:w-[35%]">
            <div className="sticky top-32 flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-white font-black italic text-2xl uppercase tracking-tighter">
                  More <span className="text-[#22c55e]">Videos</span>
                </h3>
                <Link href="/" className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest hover:underline">
                  View All
                </Link>
              </div>

              <div className="flex flex-col gap-6">
                {relatedVideos.map((item, idx) => (
                  <Link 
                    key={item.id} 
                    href={`/video/${item.id}`}
                    className="group flex gap-4 transition-all"
                  >
                    <div className="relative w-32 md:w-40 aspect-video shrink-0 rounded-lg overflow-hidden border border-white/5 group-hover:border-[#22c55e]/50 transition-colors">
                      <video src={item.src} muted className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black/60 border border-[#22c55e] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_15px_#22c55e]">
                          <Play size={14} fill="#22c55e" className="text-[#22c55e] ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded-sm text-[8px] font-black text-white">
                        {item.duration}
                      </div>
                    </div>
                    <div className="flex flex-col justify-center gap-1.5 overflow-hidden">
                      <h4 className="text-white font-bold text-sm uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-[#22c55e] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[#22c55e] text-[9px] font-black uppercase tracking-[0.2em]">
                        {item.category}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Promo Banner */}
              <div className="mt-8 p-8 bg-gradient-to-br from-[#22c55e]/20 to-black rounded-2xl border border-[#22c55e]/30 relative overflow-hidden group">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#22c55e]/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                 <h4 className="text-white font-black italic text-xl uppercase leading-tight relative z-10">
                   Join the <span className="text-[#22c55e]">Elite</span>
                 </h4>
                 <p className="text-white/60 text-xs mt-2 relative z-10">Exclusive access to KIO-X Human Performance protocols.</p>
                 <button className="mt-6 px-6 py-2 bg-[#22c55e] text-black font-black uppercase text-[10px] tracking-widest rounded-sm relative z-10">
                    Get Started
                 </button>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <Footer />
    </main>
  );
}
