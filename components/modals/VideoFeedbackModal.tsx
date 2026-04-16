"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ArrowRight, Loader2, Zap, Video, Link as LinkIcon, UploadCloud, Play, Calendar, ExternalLink, Trash2 } from "lucide-react";
import { Anton } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"] });

interface VideoFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

export default function VideoFeedbackModal({ isOpen, onClose, athleteId, athleteName }: VideoFeedbackModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    category: "Technique",
    notes: "",
    externalUrl: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/athlete/${athleteId}/video-feedback`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, athleteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("category", formData.category);
      data.append("notes", formData.notes);
      data.append("uploadMethod", uploadMethod);
      
      if (uploadMethod === "file" && videoFile) {
        data.append("video", videoFile);
      } else if (uploadMethod === "url") {
        data.append("videoUrl", formData.externalUrl);
      } else {
        throw new Error("Please provide a video file or external URL.");
      }

      const res = await fetch(`/api/admin/athlete/${athleteId}/video-feedback`, {
        method: "POST",
        body: data, // Browser automatically sets Content-Type to multipart/form-data
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setSuccess(true);
      alert("SUCCESS: Video Feedback Transmitted! You should see it in the list below.");
      setFormData({ title: "", category: "Technique", notes: "", externalUrl: "" });
      setVideoFile(null);
      
      // Refresh history instead of closing
      fetchHistory();
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Transmission Error:", err);
      alert(`SYSTEM ERROR: ${err.message || "Failed to upload tactical feedback."}`);
      setError(err.message || "Failed to upload tactical feedback.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Remove this feedback clip from the athlete's record?")) return;
    
    setDeletingId(videoId);
    try {
      const res = await fetch(`/api/admin/athlete/${athleteId}/video-feedback?videoId=${videoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete video");
      
      // Remove from UI
      setHistory(prev => prev.filter(v => v.id !== videoId));
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0a0a0a] border border-blue-500/20 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)]"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-transparent">
            <div>
              <div className="text-blue-500 text-[10px] font-black tracking-[4px] uppercase mb-1 flex items-center gap-2">
                <Video size={12} fill="currentColor" /> TACTICAL PROTOCOL
              </div>
              <h2 className={`${anton.className} text-2xl text-white tracking-wider uppercase`}>
                UPLOAD VIDEO FEEDBACK
              </h2>
            </div>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            <div className="mb-8 p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="text-white/20 text-[9px] font-black tracking-widest uppercase mb-1">TARGET SUBJECT</div>
              <div className="text-white font-bold tracking-wide uppercase">{athleteName}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 tracking-widest uppercase ml-1">Feedback Title</label>
                <input
                  required
                  placeholder="EX: MIDFIELD TRANSITION ANALYSIS"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 tracking-widest uppercase ml-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Technique">TECHNIQUE</option>
                  <option value="Tactical">TACTICAL</option>
                  <option value="Strength">STRENGTH</option>
                  <option value="General">GENERAL</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 tracking-widest uppercase ml-1">Upload Source</label>
                <div className="flex gap-2 p-1 bg-black/40 border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUploadMethod("file")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black transition-all ${uploadMethod === 'file' ? 'bg-blue-500 text-white' : 'text-white/20 hover:text-white'}`}
                  >
                    <UploadCloud size={14} /> FILE UPLOAD
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod("url")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black transition-all ${uploadMethod === 'url' ? 'bg-blue-500 text-white' : 'text-white/20 hover:text-white'}`}
                  >
                    <LinkIcon size={14} /> EXTERNAL URL
                  </button>
                </div>
              </div>

              {uploadMethod === "file" ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-all group bg-blue-500/5"
                >
                  <UploadCloud size={32} className="text-white/10 group-hover:text-blue-500 transition-colors" />
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    {videoFile ? videoFile.name : "SELECT MP4 / MOV (MAX 500MB)"}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </div>
              ) : (
                <input
                  required
                  placeholder="PASTE VIDEO URL (YOUTUBE/VIMEO/DIRECT)..."
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                />
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 tracking-widest uppercase ml-1">Strategic Notes</label>
                <textarea
                  rows={3}
                  placeholder="DETAIL THE COACHING POINTS..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white text-sm font-medium focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                  ERROR: {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-500 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                  FEEDBACK TRANSMITTED SUCCESSFULLY
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white font-black uppercase tracking-[2px] py-5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "TRANSMIT FEEDBACK"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            {/* History Section */}
            <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-white/20 text-[10px] font-black tracking-widest uppercase">RECENT TRANSMISSIONS</div>
                {historyLoading && <Loader2 size={12} className="animate-spin text-blue-500" />}
              </div>

              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="py-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-white/10 uppercase font-bold text-[9px] tracking-widest italic">
                    NO PREVIOUS TRANSMISSIONS FOUND
                  </div>
                ) : (
                  history.slice(0, 5).map((clip, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Video size={14} />
                          </div>
                          <div>
                            <div className="text-white text-xs font-bold tracking-wide uppercase">{clip.title}</div>
                            <div className="text-white/20 text-[8px] font-black tracking-wider uppercase mt-0.5">{clip.category}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                            href={clip.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-blue-500 hover:text-white transition-all"
                            title="View Link"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(clip.id);
                            }}
                            disabled={deletingId === clip.id}
                            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500 hover:text-white transition-all group/del disabled:opacity-50"
                            title="Delete Clip"
                          >
                            {deletingId === clip.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>
                      {clip.notes && (
                         <div className="text-[10px] text-white/40 leading-relaxed italic border-l-2 border-white/10 pl-3">
                           "{clip.notes}"
                         </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
