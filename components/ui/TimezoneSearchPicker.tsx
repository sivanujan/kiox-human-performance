"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Globe, X } from "lucide-react";
import { getFullTimezoneList } from "@/lib/timezone";
import { motion, AnimatePresence } from "framer-motion";

interface TimezoneOption {
  value: string;
  label: string;
  offset: number;
  displayOffset: string;
  region: string;
  country?: string;
  code?: string;
}

interface TimezoneSearchPickerProps {
  value: string;
  onChange: (value: string, timezoneData?: any) => void;
  className?: string;
}

export default function TimezoneSearchPicker({ value, onChange, className = "" }: TimezoneSearchPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allTimezones] = useState<TimezoneOption[]>(getFullTimezoneList());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTz = allTimezones.find(tz => tz.value === value) || allTimezones.find(tz => tz.value === 'UTC');

  const filteredTimezones = allTimezones.filter(tz => 
    tz.label.toLowerCase().includes(search.toLowerCase()) ||
    tz.value.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-bg-input border border-border-input rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary flex items-center justify-between hover:border-accent-green/50 transition-all focus:outline-none group"
      >
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-green group-hover:scale-110 transition-transform" size={16} />
        <span className="truncate">{selectedTz?.label || "Select Timezone"}</span>
        <ChevronDown className={`ml-2 text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={16} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] mt-2 w-full bg-bg-card border border-border-primary/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl shadow-accent/5"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-border-primary/50 bg-bg-primary/20">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search location (e.g. London, New York)..."
                  className="w-full bg-bg-input border border-border-input rounded-xl pl-4 pr-10 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-green/50 focus:outline-none transition-all"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-green" size={18} />
              </div>
            </div>

            {/* List */}
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar py-2">
              {filteredTimezones.length > 0 ? (
                filteredTimezones.map((tz) => (
                  <button
                    key={tz.value}
                    type="button"
                    onClick={() => {
                      onChange(tz.value, tz);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-5 py-3 text-left flex items-center justify-between hover:bg-bg-card-hover transition-all group/item ${
                      value === tz.value ? 'bg-accent-green/5' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${value === tz.value ? 'text-accent-green' : 'text-text-primary group-hover/item:text-accent-green'}`}>
                        {tz.label.split(' (')[0]}
                      </span>
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                        {tz.region} / {tz.value.split('/').pop()?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${
                      value === tz.value ? 'bg-accent-green/20 text-accent-green' : 'bg-bg-primary text-text-muted'
                    }`}>
                      {tz.displayOffset}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-12 text-center flex flex-col items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-bg-primary/50 flex items-center justify-center text-text-muted">
                      <Globe size={24} />
                   </div>
                   <p className="text-text-muted text-xs uppercase font-black tracking-widest italic">
                     Matrix region not found
                   </p>
                </div>
              )}
            </div>
            
            {/* Footer / Sorting Info */}
            <div className="px-4 py-2 border-t border-border-primary bg-bg-primary/50 flex justify-between items-center">
               <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">Ordered by UTC Offset</span>
               <span className="text-[8px] font-bold text-accent-green/60 uppercase tracking-widest">{filteredTimezones.length} Regions</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
