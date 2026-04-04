'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Anton } from "next/font/google";
import CustomVideoPlayer from '@/components/ui/CustomVideoPlayer';

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'] 
});

const items = [
  // VIDEOS
  {
    id: 1, type: 'video', category: 'TRAINING',
    src: '/v2/la01.mp4', title: 'Performance Training', duration: '0:31',
  },
  {
    id: 2, type: 'video', category: 'GAMES',
    src: '/v2/la02.mp4', title: 'Match Highlights', duration: '0:13',
  },
  {
    id: 3, type: 'video', category: 'TRAINING',
    src: '/v2/la03.mp4', title: 'Goalkeeper Drills', duration: '0:04',
  },
  {
    id: 4, type: 'video', category: 'PERFORMANCE',
    src: '/videos/Functional.mp4', title: 'Functional Movement', duration: '0:05',
  },
  {
    id: 5, type: 'video', category: 'TRAINING',
    src: '/videos/Legs_Speed.mp4', title: 'Speed & Agility', duration: '0:05',
  },
  {
    id: 6, type: 'video', category: 'PERFORMANCE',
    src: '/videos/vidcen.mp4', title: '360° Review', duration: '0:18',
  },
  {
    id: 7, type: 'video', category: 'CARE',
    src: '/videos/video04.mp4', title: 'Elite Recovery', duration: '1:15',
  },
  {
    id: 8, type: 'video', category: 'COMMITMENT',
    src: '/videos/video05.mp4', title: 'Performance Hub', duration: '2:30',
  }
];

const filters = ['ALL', 'TRAINING', 'GAMES', 'PERFORMANCE', 'CARE', 'COMMITMENT'];

function FlipCard({ item, index, onPlay }: { item: any; index: number; onPlay: (item: any) => void }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const backVideoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (isFlipped) {
      backVideoRef.current?.play().catch(() => {});
    } else {
      if (backVideoRef.current) backVideoRef.current.pause();
    }
  }, [isFlipped]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      style={{ perspective: '1000px', cursor: 'pointer' }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 15 }}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '125%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ===== FRONT FACE ===== */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(34,197,94,0.2)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.1)',
        }}>
          {item.type === 'video' ? (
            <video
              src={item.src}
              muted
              playsInline
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <img
              src={item.src}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}

          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />

          {item.type === 'video' && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)',
              border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', boxShadow: '0 0 20px rgba(34,197,94,0.4)', color: '#22c55e'
            }}>
              ▶
            </div>
          )}

          {item.duration && (
            <div className={anton.className} style={{
              position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.8)',
              border: '1px solid #22c55e', color: '#22c55e', fontSize: '11px', padding: '4px 8px', borderRadius: '4px',
            }}>
              {item.duration}
            </div>
          )}

          <div className={anton.className} style={{
            position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', fontSize: '11px', padding: '4px 10px',
            borderRadius: '4px', letterSpacing: '0.1em', textTransform: 'uppercase'
          }}>
            {item.category}
          </div>

          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
            <div className={anton.className} style={{ color: '#ffffff', fontSize: '20px', letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {item.title}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '12px', right: '12px', color: 'rgba(34,197,94,0.6)', fontSize: '11px' }}>
            ↻ flip
          </div>
        </div>

        {/* ===== BACK FACE ===== */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)', borderRadius: '16px', overflow: 'hidden', border: '2px solid #22c55e',
          background: '#0a0a0a', boxShadow: '0 0 30px rgba(34,197,94,0.3), 0 0 60px rgba(34,197,94,0.1), 0 10px 40px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column',
        }}>
          {item.type === 'video' ? (
            <video
              ref={backVideoRef}
              muted loop playsInline preload="none"
              style={{ width: '100%', height: '65%', objectFit: 'cover' }}
            >
              <source src={item.src} />
            </video>
          ) : (
            <img
              src={item.src}
              alt={item.title}
              style={{ width: '100%', height: '65%', objectFit: 'cover', filter: 'brightness(1.1) contrast(1.1)' }}
            />
          )}

          <div style={{
            flex: 1, padding: '16px', background: 'rgba(0,10,0,0.95)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ width: '30px', height: '2px', background: '#22c55e', marginBottom: '10px', boxShadow: '0 0 8px #22c55e' }} />

            <div className={anton.className} style={{ color: '#22c55e', fontSize: '11px', letterSpacing: '0.3em', marginBottom: '6px', textTransform: 'uppercase' }}>
              {item.category}
            </div>

            <div className={anton.className} style={{ color: '#ffffff', fontSize: '22px', marginBottom: '16px', textTransform: 'uppercase', lineHeight: 1.1 }}>
              {item.title}
            </div>

            <a
              href={item.type === 'photo' ? item.src : '#'}
              onClick={(e) => {
                if (item.type === 'video') {
                  e.preventDefault();
                  onPlay(item);
                }
              }}
              target={item.type === 'photo' ? '_blank' : undefined}
              rel={item.type === 'photo' ? 'noreferrer' : undefined}
              className={anton.className}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#000', background: '#22c55e',
                padding: '8px 16px', borderRadius: '4px', fontSize: '12px', letterSpacing: '0.15em',
                textDecoration: 'none', width: 'fit-content', cursor: 'pointer',
              }}
            >
              {item.type === 'video' ? '▶ WATCH NOW' : '🔍 VIEW FULL'}
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [playingVideo, setPlayingVideo] = useState<any>(null);

  const filtered = activeFilter === 'ALL' ? items : items.filter(i => i.category === activeFilter);

  return (
    <>
      <AnimatePresence>
        {playingVideo && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[200] bg-black flex flex-col justify-center items-center"
          >
            <div className="w-full max-w-[1600px] mx-auto">
              <CustomVideoPlayer 
                src={playingVideo.src}
                title={playingVideo.title}
                category={playingVideo.category}
                onBack={() => setPlayingVideo(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background: '#080808', minHeight: '100vh', paddingBottom: '100px' }}>
        {/* HERO BANNER */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(34,197,94,0.08) 0%, transparent 100%)',
        padding: '120px 40px 60px', textAlign: 'center', borderBottom: '1px solid rgba(34,197,94,0.1)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '50px', height: '1px', background: 'linear-gradient(90deg, transparent, #22c55e)' }} />
            <span className={anton.className} style={{ color: '#22c55e', fontSize: '12px', letterSpacing: '0.4em' }}>
              KIO-X MEDIA
            </span>
            <div style={{ width: '50px', height: '1px', background: 'linear-gradient(90deg, #22c55e, transparent)' }} />
          </div>

          <h1 className={anton.className} style={{ color: '#ffffff', fontSize: 'clamp(48px, 8vw, 100px)', margin: '0 0 16px', textTransform: 'uppercase', lineHeight: 1 }}>
            GALLERY
          </h1>

          <p style={{ color: '#666666', fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6, letterSpacing: '0.05em' }}>
            Elite training sessions, match day highlights and performance moments
          </p>
        </motion.div>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '40px 20px', flexWrap: 'wrap' }}>
        {filters.map((f, i) => (
          <motion.button
            key={f}
            onClick={() => setActiveFilter(f)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={anton.className}
            style={{
              background: activeFilter === f ? '#22c55e' : 'transparent',
              color: activeFilter === f ? '#000000' : '#666666',
              border: activeFilter === f ? '1px solid #22c55e' : '1px solid rgba(34,197,94,0.2)',
              padding: '12px 28px', borderRadius: '50px', fontSize: '13px', letterSpacing: '0.2em',
              cursor: 'pointer', transition: 'all 0.3s ease',
              boxShadow: activeFilter === f ? '0 0 20px rgba(34,197,94,0.3)' : 'none',
            }}
          >
            {f}
            <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.7 }}>
              ({f === 'ALL' ? items.length : items.filter(item => item.category === f).length})
            </span>
          </motion.button>
        ))}
      </div>

      {/* GRID */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 30px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}
          >
            {filtered.map((item, i) => (
              <FlipCard key={item.id} item={item} index={i} onPlay={(videoItem) => setPlayingVideo(videoItem)} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#444444' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚽</div>
            <div className={anton.className} style={{ fontSize: '24px', color: '#333333' }}>
              NO ITEMS FOUND
            </div>
          </div>
        )}
      </div>

      {/* LOAD MORE */}
      <div style={{ textAlign: 'center', marginTop: '70px' }}>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(34,197,94,0.3)' }}
          whileTap={{ scale: 0.97 }}
          className={anton.className}
          style={{
            background: 'transparent', color: '#22c55e', border: '1px solid #22c55e',
            padding: '16px 48px', borderRadius: '4px', fontSize: '13px', letterSpacing: '0.2em', cursor: 'pointer',
          }}
        >
          LOAD MORE →
        </motion.button>
      </div>
    </div>
    </>
  );
}
