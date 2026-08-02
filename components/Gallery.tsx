'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import CustomVideoPlayer from '@/components/ui/CustomVideoPlayer';
import { useAuth } from './providers/AuthProvider';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  X, 
  Loader2,
  FolderOpen,
  Settings
} from 'lucide-react';

function FlipCard({ item, index, onPlay, isAdmin, onDelete, onReorder, isFirst, isLast }: { 
  item: any; 
  index: number; 
  onPlay: (item: any) => void;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}) {
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
      className="relative"
    >
      {/* Admin Controls Overlay */}
      <AnimatePresence>
        {isAdmin && isFlipped && (
          <motion.div 
            key="admin-controls"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-3 -right-3 z-[60] flex flex-col gap-2"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:bg-red-600 transition-all active:scale-95"
            >
              <Trash2 size={16} />
            </button>
            <div className="flex flex-col bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1">
              <button 
                disabled={isFirst}
                onClick={(e) => { e.stopPropagation(); onReorder(item.id, 'up'); }}
                className="p-2 text-gray-500 hover:text-white disabled:opacity-20"
              >
                <ArrowUp size={16} />
              </button>
              <button 
                disabled={isLast}
                onClick={(e) => { e.stopPropagation(); onReorder(item.id, 'down'); }}
                className="p-2 text-gray-500 hover:text-white disabled:opacity-20"
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              src={item.file_path}
              muted
              playsInline
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <img
              src={item.file_path}
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

          <div className="font-display" style={{
            position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', fontSize: '11px', padding: '4px 10px',
            borderRadius: '4px', letterSpacing: '0.1em', textTransform: 'uppercase'
          }}>
            {item.category || (item.type === 'video' ? 'TRAINING' : 'MOMENT')}
          </div>

          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
            <div className="font-display uppercase tracking-widest text-[#ffffff] text-[18px] leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {item.title}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '12px', right: '12px', color: 'rgba(34,197,94,0.6)', fontSize: '11px', fontWeight: 'bold' }} className="font-display">
            ↻ FLIP
          </div>
        </div>

        {/* ===== BACK FACE ===== */}
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPlay(item);
          }}
          style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)', borderRadius: '16px', overflow: 'hidden', border: '2px solid #22c55e',
            background: 'var(--bg-card)', boxShadow: '0 0 30px rgba(34,197,94,0.3)',
            display: 'flex', flexDirection: 'column',
            zIndex: isFlipped ? 20 : 1
          }}
        >
          {item.type === 'video' ? (
            <video
              ref={backVideoRef}
              muted loop playsInline preload="none"
              style={{ width: '100%', height: '60%', objectFit: 'cover' }}
            >
              <source src={item.file_path} />
            </video>
          ) : (
            <img
              src={item.file_path}
              alt={item.title}
              style={{ width: '100%', height: '60%', objectFit: 'cover' }}
            />
          )}

          <div style={{
            flex: 1, padding: '20px', background: 'var(--bg-secondary)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px'
          }}>
            <div style={{ width: '40px', height: '1px', background: '#22c55e', marginBottom: '8px' }} />
            
            <div className="font-display text-text-primary text-[16px] uppercase tracking-wide font-black leading-tight">
              {item.title}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(item);
              }}
              className="font-display transition-all active:scale-95 group/btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#000', background: '#22c55e',
                padding: '10px 18px', borderRadius: '4px', fontSize: '11px', fontWeight: '900',
                letterSpacing: '0.15em', textDecoration: 'none', width: 'fit-content', marginTop: '12px',
                position: 'relative', zIndex: 30
              }}
            >
              {item.type === 'video' ? '▶ WATCH NOW' : '🔍 VIEW FULL'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Gallery() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [playingVideo, setPlayingVideo] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  // Admin State
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'staff';
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState(false);
  
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryActionLoading, setCategoryActionLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  // Lock scroll when player is open
  useEffect(() => {
    if (playingVideo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [playingVideo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch('/api/gallery'),
        fetch('/api/gallery/categories')
      ]);
      const [itemsData, catsData] = await Promise.all([itemsRes.json(), catsRes.json()]);
      
      if (Array.isArray(itemsData)) setItems(itemsData);
      if (Array.isArray(catsData)) {
        setCategories(catsData);
        if (catsData.length > 0) setUploadCategory(catsData[0].name);
      }
    } catch (err) {
      console.error("Gallery Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('category', uploadCategory || 'TRAINING');
      formData.append('type', uploadFile.type.startsWith('video') ? 'video' : 'image');

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (res.ok && result.success) {
        await fetchData();
        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadTitle("");
      } else {
        alert(result.error || "Upload Failed: Check file size and admin privileges.");
      }
    } catch (err: any) {
      console.error("Gallery upload error:", err);
      alert(`System Failure: ${err.message || "Could not commit file to persistent storage."}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently purge this record from the KIO-X archive?")) return;

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      alert("Command Failed: Could not delete record.");
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(newIndex, 0, movedItem);

    const updatedItems = newItems.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));
    setItems(updatedItems);

    await fetch('/api/admin/gallery/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updatedItems.map(i => ({ id: i.id, display_order: i.display_order })) })
    });
  };

  // Category Management
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;

    setCategoryActionLoading(true);
    try {
      const res = await fetch('/api/admin/gallery/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      const data = await res.json();
      if (data.success) {
        setCategories(prev => [...prev, data.data]);
        setNewCategoryName("");
      }
    } catch (err) {
      alert("Failed to create category");
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Items in this category will become unassigned.")) return;

    try {
      const res = await fetch('/api/admin/gallery/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      alert("Failed to delete category");
    }
  };

  const filtered = activeFilter === 'ALL' ? items : items.filter(i => (i.category || 'TRAINING') === activeFilter);

  return (
    <>
      {/* PORTAL WRAPPER (Always on top of the DOM stack) */}
      {mounted && createPortal(
        <AnimatePresence>
          {playingVideo && (
            <motion.div 
              key="video-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] bg-black flex flex-col justify-center items-center"
            >
              <div className="w-full h-full relative">
                {playingVideo.type === 'video' ? (
                  <CustomVideoPlayer 
                    src={playingVideo.file_path}
                    title={playingVideo.title}
                    category={playingVideo.category || 'EXCELLENCE'}
                    onBack={() => setPlayingVideo(null)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                    <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-[110]">
                      <button 
                        onClick={() => setPlayingVideo(null)}
                        className="flex items-center gap-3 px-6 py-2.5 bg-black/60 backdrop-blur-md border border-[#22c55e]/30 text-[#22c55e] rounded-full hover:bg-[#22c55e] hover:text-black transition-all font-bold uppercase tracking-widest text-xs"
                      >
                        <X size={18} /> Back To Gallery
                      </button>
                      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
                        <span className="text-[#22c55e] text-[9px] font-black tracking-[4px] uppercase">{playingVideo.category || 'MOMENT'}</span>
                        <h2 className="text-white font-bold tracking-widest text-lg uppercase">{playingVideo.title}</h2>
                      </div>
                    </div>
                    <img 
                      src={playingVideo.file_path} 
                      alt={playingVideo.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '100px' }}>
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
              <span className="font-display" style={{ color: '#22c55e', fontSize: '12px', letterSpacing: '0.4em', fontWeight: '900' }}>
                KIO-X MEDIA ARCHIVE
              </span>
              <div style={{ width: '50px', height: '1px', background: 'linear-gradient(90deg, #22c55e, transparent)' }} />
            </div>

            <h1 className="font-display" style={{ color: 'var(--text-primary)', fontSize: 'clamp(48px, 8vw, 100px)', margin: '0 0 16px', textTransform: 'uppercase', lineHeight: 1, fontWeight: '900', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
              GALLERY
            </h1>

            <p className="font-display uppercase tracking-[0.2em]" style={{ color: '#666666', fontSize: '12px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6, fontWeight: 'bold' }}>
              Elite training highlights and technical performance reviews
            </p>

            {isAdmin && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUploadOpen(true)}
                  className="px-8 py-3 bg-[#22c55e] text-black font-display font-black tracking-widest text-[11px] uppercase rounded-full shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                >
                  + ADD NEW MEDIA
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCategoryManageOpen(true)}
                  className="px-8 py-3 border border-white/20 text-white font-display font-black tracking-widest text-[11px] uppercase rounded-full hover:border-[#22c55e] hover:text-[#22c55e] transition-all"
                >
                  <Settings size={14} className="inline mr-2" /> Categories
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '40px 20px', flexWrap: 'wrap' }}>
          <motion.button
            onClick={() => setActiveFilter('ALL')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="font-display"
            style={{
              background: activeFilter === 'ALL' ? '#22c55e' : 'transparent',
              color: activeFilter === 'ALL' ? '#000000' : 'var(--text-secondary)',
              border: activeFilter === 'ALL' ? '1px solid #22c55e' : '1px solid rgba(34,197,94,0.2)',
              padding: '12px 28px', borderRadius: '50px', fontSize: '11px', letterSpacing: '0.2em',
              fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s ease',
            }}
          >
            ALL ({items.length})
          </motion.button>
          
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              onClick={() => setActiveFilter(cat.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="font-display"
              style={{
                background: activeFilter === cat.name ? '#22c55e' : 'transparent',
                color: activeFilter === cat.name ? '#000000' : 'var(--text-secondary)',
                border: activeFilter === cat.name ? '1px solid #22c55e' : '1px solid rgba(34,197,94,0.2)',
                padding: '12px 28px', borderRadius: '50px', fontSize: '11px', letterSpacing: '0.2em',
                fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: activeFilter === cat.name ? '0 0 20px rgba(34,197,94,0.3)' : 'none',
              }}
            >
              {cat.name}
              <span style={{ marginLeft: '8px', fontSize: '10px', opacity: 0.7 }}>
                ({items.filter(item => (item.category || 'TRAINING') === cat.name).length})
              </span>
            </motion.button>
          ))}
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 30px' }}>
          {loading ? (
             <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
               <Loader2 className="animate-spin text-[#22c55e]" size={40} />
               <span className="font-display text-[#22c55e] font-black tracking-[0.4em] text-[10px] uppercase">Retrieving Data...</span>
             </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}
              >
                {filtered.map((item, i) => (
                  <FlipCard 
                    key={item.id} 
                    item={item} 
                    index={i} 
                    onPlay={(media) => setPlayingVideo(media)} 
                    isAdmin={isAdmin}
                    onDelete={handleDelete}
                    onReorder={handleReorder}
                    isFirst={i === 0}
                    isLast={i === filtered.length - 1}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '120px 20px', color: '#22c55e', opacity: 0.3 }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>∅</div>
              <div className="font-display" style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '0.5em' }}>
                ARCHIVE EMPTY
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => !uploadLoading && setIsUploadOpen(false)}
               className="absolute inset-0 bg-black/90 backdrop-blur-xl"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="relative w-full max-w-xl bg-bg-card border border-border-card rounded-[40px] p-10 overflow-hidden"
             >
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <span className="text-[#22c55e] text-[10px] font-black uppercase tracking-[4px]">Media Ingestion</span>
                      <h2 className="text-3xl font-display font-black text-text-primary italic uppercase">Upload New Asset</h2>
                   </div>
                   <button onClick={() => setIsUploadOpen(false)} className="p-3 text-text-muted hover:text-text-primary transition-colors">
                      <X size={24} />
                   </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center gap-4 transition-all cursor-pointer ${
                      uploadFile ? 'border-[#22c55e] bg-[#22c55e]/5' : 'border-border-card hover:border-[#22c55e]/50'
                    }`}
                  >
                    <Upload size={32} className={uploadFile ? 'text-[#22c55e]' : 'text-text-muted'} />
                    <div className="text-center font-display">
                      <div className="text-text-primary text-xs font-black uppercase tracking-widest shrink-0 truncate max-w-[300px]">
                        {uploadFile ? uploadFile.name : "Select Media Record"}
                      </div>
                      <div className="text-text-muted text-[10px] mt-1 tracking-widest uppercase">MP4 / MOV / JPG / PNG</div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted tracking-[2px] uppercase ml-1">Title</label>
                      <input 
                        required placeholder="EX: ELITE DRILL 01"
                        value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full bg-bg-input border border-border-input rounded-2xl py-4 px-6 font-display font-bold text-text-primary focus:outline-none focus:border-[#22c55e] transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted tracking-[2px] uppercase ml-1">Classification</label>
                      <select 
                        value={uploadCategory} 
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full bg-bg-input border border-border-input rounded-2xl py-4 px-6 font-display font-bold text-text-primary focus:outline-none focus:border-[#22c55e] transition-all cursor-pointer appearance-none"
                      >
                         {categories.map(c => <option key={c.id} value={c.name} className="bg-bg-input text-text-primary">{c.name}</option>)}
                         <option value="TRAINING" className="bg-bg-input text-text-muted italic">No Groups Available</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    disabled={!uploadFile || uploadLoading}
                    className="w-full py-5 rounded-3xl bg-text-primary text-bg-primary font-display font-black uppercase tracking-[8px] hover:bg-[#22c55e] transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-xl"
                  >
                    {uploadLoading ? <Loader2 className="animate-spin" size={20} /> : "COMMIT TO ARCHIVE"}
                  </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCategoryManageOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => !categoryActionLoading && setIsCategoryManageOpen(false)}
               className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
             />
             <motion.div 
               initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
               className="relative w-full max-w-lg bg-bg-card border border-border-card rounded-[40px] p-10"
             >
                <div className="flex justify-between items-center mb-8">
                   <div>
                      <span className="text-[#22c55e] text-[10px] font-black uppercase tracking-[4px]">System Registry</span>
                      <h2 className="text-3xl font-display font-black text-text-primary italic uppercase">Manage Channels</h2>
                   </div>
                   <button onClick={() => setIsCategoryManageOpen(false)} className="p-3 text-text-muted hover:text-text-primary transition-colors">
                      <X size={24} />
                   </button>
                </div>

                <form onSubmit={handleAddCategory} className="flex gap-2 mb-8">
                   <input 
                    required placeholder="NEW CATEGORY NAME..."
                    value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-bg-input border border-border-input rounded-2xl py-4 px-6 font-display font-bold text-text-primary focus:border-[#22c55e] transition-all"
                   />
                   <button 
                    disabled={categoryActionLoading || !newCategoryName}
                    className="px-6 bg-[#22c55e] text-black rounded-2xl font-black transition-all hover:bg-text-primary disabled:opacity-30"
                   >
                     {categoryActionLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                   </button>
                </form>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                   {categories.map(cat => (
                     <div key={cat.id} className="flex items-center justify-between p-5 bg-bg-secondary border border-border-card rounded-2xl group/cat">
                        <div className="flex items-center gap-4">
                           <FolderOpen size={18} className="text-[#22c55e]" />
                           <span className="text-text-primary font-display font-bold tracking-widest text-sm">{cat.name}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover/cat:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
