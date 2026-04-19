"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, X, Check, UploadCloud } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  initialUrl?: string | null;
  folder?: string; // Default to 'avatars'
  className?: string;
}

export default function ImageUpload({ onUpload, initialUrl, folder = "avatars", className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Instant Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);
    setStatus("INITIALIZING PROTOCOL...");

    try {
      // 2. Generate random filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      setStatus("UPLOADING BYTES...");
      console.log(`Starting upload to /${folder}/${filePath}...`);

      // 3. Upload to Supabase Storage with Timeout
      const uploadPromise = supabase.storage.from(folder).upload(filePath, file);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("NETWORK TIMEOUT: Upload took too long. Check your internet connection and try again.")), 60000)
      );

      const { data, error: uploadError } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]) as any;

      if (uploadError) {
        console.error("Supabase Storage Error:", uploadError);
        throw new Error(`Upload Protocol Error: ${uploadError.message}`);
      }

      setStatus("FINALIZING SYNC...");
      console.log("Upload successful:", data);

      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(folder)
        .getPublicUrl(filePath);

      console.log("Public URL generated:", publicUrl);
      onUpload(publicUrl);
      setStatus("");
    } catch (error: any) {
      console.error("CRITICAL UPLOAD FAILURE:", error);
      const msg = error.message || "Unknown upload error";
      const isTimeout = msg.toLowerCase().includes("timeout");
      alert(`SYSTEM ERROR: ${msg}${isTimeout ? "\n\nTip: Try a smaller image file or check your internet connection." : ""}`);
      setPreviewUrl(initialUrl || null); // Reset on failure
      setStatus("");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onUpload("");
  };

  return (
    <div className={`relative flex flex-col items-center gap-2 ${className}`}>
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center cursor-pointer overflow-hidden transition-all group-hover:border-[#22c55e]/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {previewUrl ? (
          <>
            <Image 
              src={previewUrl} 
              alt="Preview" 
              fill 
              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
              unoptimized={true}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Camera size={20} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-[#22c55e] transition-colors">
            <UploadCloud size={24} />
            <span className="text-[8px] font-black uppercase tracking-[1px]">UPLOAD</span>
          </div>
        )}

        {/* Loading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
            <Loader2 size={24} className="text-[#22c55e] animate-spin" />
          </div>
        )}
      </div>

      {status && (
        <span className="text-[8px] font-black text-[#22c55e] uppercase tracking-[2px] animate-pulse">
          {status}
        </span>
      )}

      {/* Action Indicators */}
      {previewUrl && !uploading && (
        <button 
          onClick={removeImage}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-white hover:text-red-500 transition-all shadow-xl"
        >
          <X size={12} strokeWidth={4} />
        </button>
      )}

      {/* Hidden Input */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
