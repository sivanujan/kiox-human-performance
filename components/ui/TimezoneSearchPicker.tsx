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
        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white flex items-center justify-between hover:border-[#22c55e]/50 transition-all focus:outline-none group"
      >
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[#22c55e] group-hover:scale-110 transition-transform" size={16} />
        <span className="truncate">{selectedTz?.label || "Select Timezone"}</span>
        <ChevronDown className={`ml-2 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={16} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] mt-2 w-full bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-white/5 bg-white/[0.03]">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search location (e.g. London, New York)..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#22c55e]/50 focus:outline-none transition-all"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#22c55e]" size={18} />
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
                    className={`w-full px-5 py-3 text-left flex items-center justify-between hover:bg-white/[0.03] transition-all group/item ${
                      value === tz.value ? 'bg-[#22c55e]/5' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${value === tz.value ? 'text-[#22c55e]' : 'text-gray-300 group-hover/item:text-white'}`}>
                        {tz.label.split(' (')[0]}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                        {tz.region} / {tz.value.split('/').pop()?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${
                      value === tz.value ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-white/5 text-gray-500'
                    }`}>
                      {tz.displayOffset}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-12 text-center flex flex-col items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-700">
                      <Globe size={24} />
                   </div>
                   <p className="text-gray-500 text-xs uppercase font-black tracking-widest italic">
                     Matrix region not found
                   </p>
                </div>
              )}
            </div>
            
            {/* Footer / Sorting Info */}
            <div className="px-4 py-2 border-t border-white/5 bg-black/60 flex justify-between items-center">
               <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Ordered by UTC Offset</span>
               <span className="text-[8px] font-bold text-[#22c55e]/40 uppercase tracking-widest">{filteredTimezones.length} Regions</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
