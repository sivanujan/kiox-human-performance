"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, 
  Maximize, Minimize, Monitor, Settings, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

interface CustomVideoPlayerProps {
  src: string;
  type?: 'portrait' | 'landscape';
  title?: string;
  category?: string;
  onBack?: () => void;
}

export default function CustomVideoPlayer({ src, type = 'landscape', title, category, onBack }: CustomVideoPlayerProps) {

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
        showToast("▶ Playing");
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        showToast("⏸ Paused");
      }
    }
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1500);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const skip = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
      showToast(amount > 0 ? `+${amount}s` : `${amount}s`);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      showToast(nextMuted ? "🔇 Muted" : "🔊 Unmuted");
    }
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
      showToast(`${nextSpeed}x Speed`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    try {
      if (videoRef.current && document.pictureInPictureElement !== videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault(); togglePlay(); break;
        case 'f':
          toggleFullscreen(); break;
        case 'm':
          toggleMute(); break;
        case 'arrowleft':
          skip(-10); break;
        case 'arrowright':
          skip(10); break;
        case 'arrowup':
          e.preventDefault(); handleVolumeChange(Math.min(1, volume + 0.1)); break;
        case 'arrowdown':
          e.preventDefault(); handleVolumeChange(Math.max(0, volume - 0.1)); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, volume, isMuted, playbackSpeed]);

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    setHoverTime(percent * duration);
    setHoverX(x);
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      if (e.detail === 2) skip(-10);
    } else {
      if (e.detail === 2) skip(10);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
        setHoverTime(null);
      }}
      className="relative w-full h-[60vh] md:h-[80vh] bg-black overflow-hidden group select-none"
    >
      {/* Blurred Background for Portrait */}
      {type === 'portrait' && (
        <div className="absolute inset-0 z-0 overflow-hidden opacity-40 blur-3xl scale-110">
           <video src={src} muted loop autoPlay className="w-full h-full object-cover" />
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className={`relative z-10 w-full h-full cursor-pointer ${type === 'portrait' ? 'object-contain' : 'object-cover'}`}
        onClick={(e) => {
          if (e.detail === 1) togglePlay();
          handleDoubleTap(e);
        }}

        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />


      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />

      {/* Loading Spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-50"
          >
            <div className="w-16 h-16 border-4 border-[#22c55e]/20 border-top-[#22c55e] rounded-full animate-spin" style={{ borderTopColor: '#22c55e' }} />
            <span className="mt-4 text-[#22c55e] font-bold tracking-[0.3em] text-sm animate-pulse">LOADING...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big Center Play Button (Visible when paused) */}
      <AnimatePresence>
        {!isPlaying && !isLoading && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-[#22c55e]/20 border-2 border-[#22c55e] flex items-center justify-center text-white backdrop-blur-sm z-40 animate-[centerPulse_2s_infinite]"
          >
            <Play size={40} fill="currentColor" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Top Bar (Title & Back) */}
      <motion.div 
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
        className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent"
      >
        <button 
          onClick={onBack}
          className="flex items-center gap-3 px-6 py-2.5 bg-black/60 backdrop-blur-md border border-[#22c55e]/30 text-[#22c55e] rounded-full hover:bg-[#22c55e] hover:text-black transition-all font-bold uppercase tracking-widest text-xs relative z-10"
        >
          <ArrowLeft size={18} /> Back To Gallery
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none">
          <h2 className="text-white font-bold tracking-widest text-lg hidden md:block whitespace-nowrap">
            {title || "EXCELLENCE IN MOTION"}
          </h2>
          {category && (
            <span className="px-2 py-1 bg-[#22c55e] text-black text-[10px] font-black rounded-sm uppercase">
              {category}
            </span>
          )}
        </div>
        
        <div className="w-32" /> {/* Spacer */}
      </motion.div>

      {/* Keyboard Shortcut Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4 bg-black/80 border border-[#22c55e] text-white rounded-lg shadow-2xl z-[60] font-bold tracking-widest uppercase pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Bar */}
      <motion.div 
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        className="absolute bottom-0 left-0 right-0 p-6 md:p-10 pb-12 z-50 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
      >
        {/* Progress Bar Container */}
        <div 
          className="group/progress relative h-6 flex items-center mb-6 cursor-pointer"
          onMouseMove={handleProgressHover}
        >
           {/* Hover Preview Thumbnail */}
           <AnimatePresence>
             {hoverTime !== null && (
               <motion.div 
                 initial={{ opacity: 0, y: 10, scale: 0.9 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.9 }}
                 className="absolute bottom-10 flex flex-col items-center gap-2 pointer-events-none"
                 style={{ left: hoverX, transform: 'translateX(-50%)' }}
               >
                  <div className="w-32 aspect-video bg-black rounded-lg border-2 border-[#22c55e] overflow-hidden shadow-2xl">
                    <video 
                      src={src} 
                      ref={(el) => {
                        if (el && hoverTime !== null) {
                          el.currentTime = hoverTime;
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="bg-black/80 px-2 py-1 rounded text-[10px] font-mono font-bold text-[#22c55e] border border-[#22c55e]/30">
                    {formatTime(hoverTime)}
                  </span>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="absolute w-full h-1 bg-white/20 rounded-full group-hover/progress:h-1.5 transition-all">
             {/* Progress Fill */}
             <div 
               className="h-full bg-[#22c55e] rounded-full relative"
               style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
             >
                {/* Thumb */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#22c55e] rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-[0_0_10px_#22c55e]" />
             </div>
           </div>
           
           {/* Invisible click area */}
           <input 
             type="range"
             min="0"
             max={duration || 0}
             value={currentTime}
             onChange={(e) => {
               const val = parseFloat(e.target.value);
               setCurrentTime(val);
               if (videoRef.current) videoRef.current.currentTime = val;
             }}
             className="absolute inset-0 w-full opacity-0 cursor-pointer"
           />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="w-12 h-12 rounded-full border border-[#22c55e]/50 flex items-center justify-center text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-all"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>

            {/* Skips */}
            <div className="flex items-center gap-4 text-white/70">
              <button onClick={() => skip(-10)} className="hover:text-[#22c55e] transition-colors flex flex-col items-center">
                <RotateCcw size={20} />
                <span className="text-[10px] font-bold mt-1">10</span>
              </button>
              <button onClick={() => skip(10)} className="hover:text-[#22c55e] transition-colors flex flex-col items-center">
                <RotateCw size={20} />
                <span className="text-[10px] font-bold mt-1">10</span>
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 group/volume">
              <button onClick={toggleMute} className="text-white/70 hover:text-[#22c55e] transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
              <div className="w-0 group-hover/volume:w-24 overflow-hidden transition-all duration-300 flex items-center">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-[#22c55e]"
                />
              </div>
            </div>

            {/* Time */}
            <div className="font-mono text-sm text-white/80 tracking-tighter">
              {formatTime(currentTime)} <span className="text-gray-400 mx-1">/</span> {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Playback Speed */}
            <button 
              onClick={cyclePlaybackSpeed}
              className="px-3 py-1 border border-white/20 rounded text-xs font-bold text-white hover:border-[#22c55e] hover:text-[#22c55e] transition-all min-w-[50px]"
            >
              {playbackSpeed}x
            </button>

            {/* PiP */}
            <button onClick={togglePiP} className="text-white/70 hover:text-[#22c55e] transition-colors">
              <Monitor size={22} />
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-[#22c55e] hover:scale-110 transition-transform">
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
