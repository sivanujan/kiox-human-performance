"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ArrowRight, Loader2, Zap, Video, Link as LinkIcon, UploadCloud, Play, Calendar, ExternalLink, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";


interface VideoFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

export default function VideoFeedbackModal({ isOpen, onClose, athleteId, athleteName }: VideoFeedbackModalProps) {
  const [resolvedAthleteName, setResolvedAthleteName] = useState(athleteName);
  const [formData, setFormData] = useState({
    title: "",
    category: "Technique",
    notes: "",
    externalUrl: "" });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAthleteName = async () => {
      const cleanName = (athleteName || "").trim().toLowerCase();
      const isUndefined = !cleanName || cleanName === "undefined" || cleanName === "undefined undefined" || cleanName === "undefined ";
      
      if (isUndefined && athleteId) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", athleteId)
            .single();
          
          if (!error && data) {
            setResolvedAthleteName(`${data.first_name || ""} ${data.last_name || ""}`.trim());
          } else {
            setResolvedAthleteName("Athlete Profile");
          }
        } catch (err) {
          console.error("Failed to fetch athlete name in modal:", err);
          setResolvedAthleteName("Athlete Profile");
        }
      } else {
        setResolvedAthleteName(athleteName);
      }
    };

    if (isOpen) {
      fetchAthleteName();
    }
  }, [isOpen, athleteId, athleteName]);

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
        method: "DELETE" });
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
          className="relative w-full md:max-w-md bg-[#111] border border-gray-800 rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50"
        >
          {/* Drag handle — mobile only */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-700" />
          </div>

          {/* Modal Header */}
          <div className="flex items-start justify-between p-5 md:p-6 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#22c55e] text-xs">⚡</span>
                <span className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                  COMMAND PROTOCOL
                </span>
              </div>
              <h2 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                VIDEO FEEDBACK
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-white transition-all touch-manipulation flex-shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="p-5 md:p-6 space-y-5">
            {/* Target Subject (read-only) */}
            <div>
              <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                TARGET SUBJECT
              </label>
              <div className="w-full bg-bg-primary/50 border border-border-primary/50 rounded-xl px-4 py-3 text-sm text-text-primary font-medium">
                {resolvedAthleteName}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Feedback Title</label>
                <input
                  required
                  placeholder="EX: MIDFIELD TRANSITION ANALYSIS"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Category</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium appearance-none cursor-pointer"
                  >
                    <option value="Technique">TECHNIQUE</option>
                    <option value="Tactical">TACTICAL</option>
                    <option value="Strength">STRENGTH</option>
                    <option value="General">GENERAL</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▾</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Upload Source</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setUploadMethod("file")}
                     className={`flex-1 py-2.5 font-mono text-[10px] tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                        uploadMethod === 'file'
                          ? 'bg-[#22c55e]/20 text-[#22c55e] border-r border-gray-800'
                          : 'bg-transparent text-gray-500 border-r border-gray-800 hover:text-gray-300'
                      }`}
                  >
                    <UploadCloud size={14} /> FILE UPLOAD
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod("url")}
                    className={`flex-1 py-2.5 font-mono text-[10px] tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                        uploadMethod === 'url'
                          ? 'bg-[#22c55e]/20 text-[#22c55e]'
                          : 'bg-transparent text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <LinkIcon size={14} /> EXTERNAL URL
                  </button>
                </div>
              </div>

              {uploadMethod === "file" ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-700 hover:border-[#22c55e]/50 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-[#22c55e]/5 active:bg-[#22c55e]/10 group"
                >
                  <div className="text-[#22c55e] text-2xl mb-2 flex justify-center group-hover:scale-110 transition-transform">↑</div>
                  <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
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
                  placeholder="PASTE VIDEO URL..."
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                />
              )}

              <div className="space-y-2">
                <label className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">Strategic Notes</label>
                <textarea
                  rows={3}
                  placeholder="DETAIL THE COACHING POINTS..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-sm text-text-primary focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 outline-none transition-all placeholder:text-text-muted/50 font-medium"
                />
              </div>

              {error && (
                <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                  ERROR: {error}
                </div>
              )}

              <div className="sticky bottom-0 pt-4 bg-[#111] border-t border-gray-800 mt-6 -mx-6 px-6 pb-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#22c55e] hover:bg-[#4ade80] disabled:bg-[#22c55e]/50 disabled:cursor-not-allowed text-black font-display font-bold text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            PROCESSING...
                        </>
                    ) : (
                        <>TRANSMIT FEEDBACK →</>
                    )}
                </button>
              </div>
            </form>

            {/* Recent Transmissions Section */}
            <div className="mt-5 pt-5 border-t border-gray-800">
               <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                 RECENT TRANSMISSIONS
               </div>
               
               {history.length === 0 ? (
                 <div className="block text-[13px] font-sans font-medium text-text-secondary tracking-wide ml-1">
                    NO PREVIOUS DATA STREAMS FOUND
                 </div>
               ) : (
                 history.slice(0, 5).map(upload => (
                   <div key={upload.id} 
                        className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-gray-700 transition-all mb-2 group/clip">
                     
                     <div className="w-8 h-8 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center text-[#22c55e] text-xs group-hover/clip:bg-[#22c55e]/20 transition-all">
                       ▶
                     </div>
                     
                     <div className="flex-1 min-w-0">
                       <div className="font-display text-xs font-bold text-white tracking-wider uppercase truncate">
                         {upload.title}
                       </div>
                       <div className="font-mono text-[9px] text-gray-600 font-bold tracking-wider uppercase">
                         {upload.category}
                       </div>
                     </div>
                     
                     <div className="flex gap-1 flex-shrink-0">
                       <a 
                         href={upload.video_url} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-[#22c55e] text-xs transition-all touch-manipulation"
                       >
                         ↗
                       </a>
                       <button 
                         onClick={() => handleDelete(upload.id)}
                         disabled={deletingId === upload.id}
                         className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 text-xs transition-all touch-manipulation"
                       >
                         {deletingId === upload.id ? <Loader2 size={12} className="animate-spin" /> : '🗑'}
                       </button>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
