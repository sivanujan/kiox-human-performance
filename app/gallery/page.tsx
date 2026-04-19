"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon, 
  Video, 
  X, 
  Plus, 
  Loader2, 
  Eye, 
  Settings,
  Grid,
  Maximize2
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface GalleryItem {
  id: string;
  title: string;
  file_path: string;
  type: 'image' | 'video';
  display_order: number;
}

export default function GalleryPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Upload State
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'staff';

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
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
      formData.append('type', uploadFile.type.startsWith('video') ? 'video' : 'image');

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (result.success) {
        setItems(prev => [...prev, result.data].sort((a,b) => a.display_order - b.display_order));
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadTitle("");
      } else {
        alert(result.error || "Upload failed");
      }
    } catch (err) {
      alert("System Error: Failed to upload file");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this item from the gallery?")) return;

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
      alert("Failed to delete item");
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

    // Update orders locally for immediate feedback
    const itemsToUpdate = newItems.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));
    setItems(itemsToUpdate);

    // Persist to server
    try {
      await fetch('/api/admin/gallery/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: itemsToUpdate.map(i => ({ id: i.id, display_order: i.display_order }))
        })
      });
    } catch (err) {
      console.error("Reorder sync failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <main className="relative max-w-7xl mx-auto px-6 py-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 px-4">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-0.5 bg-blue-500" />
              <span className="text-blue-500 text-xs font-black tracking-[6px] uppercase">Operational Intelligence</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase leading-[0.9]"
            >
               Tactical <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/20">Gallery</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full border text-xs font-black tracking-widest transition-all ${
                  isEditMode 
                  ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <Settings size={14} className={isEditMode ? 'animate-spin' : ''} />
                {isEditMode ? 'EXIT EDIT MODE' : 'MANAGE ARCHIVE'}
              </motion.button>
            )}
            {isEditMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-white text-black p-3 rounded-full shadow-xl hover:bg-gray-200 transition-all"
              >
                <Plus size={24} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <span className="text-[10px] font-black tracking-[4px] text-gray-500">SYNCHRONIZING REPOSITORY...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] gap-4">
            <Grid className="text-gray-800" size={64} />
            <span className="text-gray-600 font-bold uppercase tracking-widest text-sm">No Tactical Records Found</span>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <div className={`relative aspect-[4/5] rounded-[32px] overflow-hidden bg-white/5 border border-white/5 transition-all duration-500 ${isEditMode ? 'border-blue-500/40 ring-1 ring-blue-500/20' : 'group-hover:border-white/20'}`}>
                    {/* Media */}
                    {item.type === 'video' ? (
                      <video 
                        src={item.file_path} 
                        muted 
                        loop 
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                      />
                    ) : (
                      <img 
                        src={item.file_path} 
                        alt={item.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      />
                    )}

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Content */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                      <div className="flex items-center gap-2 mb-2">
                        {item.type === 'video' ? <Video size={14} className="text-blue-500" /> : <ImageIcon size={14} className="text-purple-500" />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{item.type}</span>
                      </div>
                      <h3 className="text-xl font-bold uppercase tracking-wide leading-none">{item.title}</h3>
                      
                      {/* Interaction Area */}
                      {!isEditMode && (
                        <button 
                          onClick={() => setSelectedItem(item)}
                          className="mt-6 flex items-center justify-center gap-2 p-4 rounded-2xl bg-white text-black text-[10px] font-black tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-2xl"
                        >
                          <Maximize2 size={16} /> VIEW RECORD
                        </button>
                      )}
                    </div>

                    {/* Badge */}
                    <div className="absolute top-6 left-6 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 group-hover:border-white/30 transition-all">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'video' ? 'bg-blue-500 animate-pulse' : 'bg-purple-500'}`} />
                      <span className="text-[9px] font-black text-white/80 uppercase">#{String(index + 1).padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* Admin Tooling */}
                  <AnimatePresence>
                    {isEditMode && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute -top-3 -right-3 z-10 flex flex-col gap-2"
                      >
                         <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-3 rounded-2xl bg-red-500 text-white shadow-xl hover:bg-red-600 hover:scale-110 transition-all active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="flex flex-col rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 p-1">
                          <button 
                            disabled={index === 0}
                            onClick={() => handleReorder(item.id, 'up')}
                            className="p-2 text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button 
                             disabled={index === items.length - 1}
                             onClick={() => handleReorder(item.id, 'down')}
                             className="p-2 text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Lightbox / Preview */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />
            
            <motion.div
              layoutId={selectedItem.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full max-w-7xl max-h-[85vh] flex flex-col items-center justify-center"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute -top-12 right-0 p-4 text-white hover:text-gray-400 transition-colors"
              >
                <X size={32} />
              </button>

              <div className="w-full h-full overflow-hidden rounded-[40px] bg-black shadow-[0_0_100px_rgba(255,255,255,0.05)] border border-white/5">
                {selectedItem.type === 'video' ? (
                  <video 
                    src={selectedItem.file_path} 
                    controls 
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={selectedItem.file_path} 
                    className="w-full h-full object-contain"
                    alt={selectedItem.title}
                  />
                )}
              </div>
              
              <div className="mt-8 text-center space-y-2">
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[4px]">Media Archive Access</span>
                <h2 className="text-3xl font-display font-black tracking-tight uppercase">{selectedItem.title}</h2>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploadLoading && setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[48px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]"
            >
              <div className="p-12">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <span className="text-blue-500 text-[10px] font-black uppercase tracking-[4px]">Repository</span>
                    <h2 className="text-3xl font-black uppercase tracking-tight font-display italic">Acknowledge New File</h2>
                  </div>
                  <button onClick={() => setIsUploadModalOpen(false)} className="p-3 rounded-full hover:bg-white/5 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-8">
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${
                      uploadFile 
                      ? 'border-blue-500/50 bg-blue-500/5' 
                      : 'border-white/10 hover:border-white/30 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className={`p-5 rounded-full transition-all ${uploadFile ? 'bg-blue-500 text-white' : 'bg-white/5 group-hover:bg-white/10 text-gray-500'}`}>
                      <Upload size={32} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold uppercase tracking-widest leading-relaxed">
                        {uploadFile ? uploadFile.name : "Select Image or Video"}
                      </div>
                      <span className="text-[10px] text-gray-600 font-black tracking-widest mt-1">MAX SIZE: 500MB</span>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*,video/*"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 tracking-[3px] uppercase ml-1">Classification Label</label>
                    <input 
                      required
                      placeholder="EX: TACTICAL DRILL_04A"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-700"
                    />
                  </div>

                  <button 
                    disabled={!uploadFile || uploadLoading}
                    className="w-full py-6 rounded-3xl bg-white text-black font-black uppercase tracking-[3px] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                  >
                    {uploadLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        COMMITTING...
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        UPLOAD TO CLOUD
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
