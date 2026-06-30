"use client";

import React, { useState, useRef } from "react";
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react";

export interface BodyMarker {
  id: string;
  x: number;
  y: number;
  side: "front" | "back";
  note: string;
}

interface BodyMapProps {
  markers: BodyMarker[];
  onChange?: (markers: BodyMarker[]) => void;
  readOnly?: boolean;
}

export default function BodyMap({ markers = [], onChange, readOnly = false }: BodyMapProps) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number; side: "front" | "back" } | null>(null);

  const frontSvgRef = useRef<SVGSVGElement>(null);
  const backSvgRef = useRef<SVGSVGElement>(null);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>, side: "front" | "back") => {
    if (readOnly) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

    setClickCoords({ x, y, side });
    setTempNote("");
    setShowNoteInput(true);
    setEditingMarkerId(null);
  };

  const handleSaveMarker = () => {
    if (!clickCoords || !tempNote.trim()) return;

    const newMarker: BodyMarker = {
      id: Math.random().toString(36).substring(2, 9),
      x: clickCoords.x,
      y: clickCoords.y,
      side: clickCoords.side,
      note: tempNote.trim(),
    };

    const updated = [...markers, newMarker];
    if (onChange) onChange(updated);

    setShowNoteInput(false);
    setClickCoords(null);
    setTempNote("");
  };

  const handleUpdateMarkerNote = (id: string) => {
    if (!tempNote.trim()) return;

    const updated = markers.map((m) => (m.id === id ? { ...m, note: tempNote.trim() } : m));
    if (onChange) onChange(updated);

    setEditingMarkerId(null);
    setTempNote("");
  };

  const handleDeleteMarker = (id: string) => {
    if (readOnly) return;
    const updated = markers.filter((m) => m.id !== id);
    if (onChange) onChange(updated);
  };

  const startEditing = (marker: BodyMarker) => {
    if (readOnly) return;
    setEditingMarkerId(marker.id);
    setTempNote(marker.note);
    setShowNoteInput(false);
  };

  // Silhouette SVG component for reuse
  const BodySilhouette = ({ side }: { side: "front" | "back" }) => {
    const svgRef = side === "front" ? frontSvgRef : backSvgRef;
    const sideMarkers = markers.filter((m) => m.side === side);

    return (
      <div className="relative flex flex-col items-center">
        <h4 className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-3">
          {side === "front" ? "Front View" : "Back View"}
        </h4>
        <div className="relative border border-[var(--border-primary)] bg-[var(--bg-primary)]/50 rounded-2xl p-4 w-full max-w-[220px] flex justify-center items-center group overflow-hidden">
          {/* Tactical Grid Background overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(var(--accent-green)_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <svg
            ref={svgRef}
            viewBox="0 0 100 220"
            className={`w-full max-w-[180px] h-auto select-none relative ${!readOnly ? "cursor-crosshair" : ""}`}
            onClick={(e) => handleSvgClick(e, side)}
          >
            {/* Outline body path */}
            <path
              d="M 50 15 
                 C 42 15, 38 21, 38 28
                 C 38 35, 42 41, 50 41
                 C 58 41, 62 35, 62 28
                 C 62 21, 58 15, 50 15 Z
                 
                 M 45 41 L 55 41 L 55 48 L 45 48 Z
                 
                 M 45 48 
                 C 33 49, 30 55, 27 63
                 L 14 105
                 C 12 110, 16 114, 20 110
                 L 28 80 L 28 125
                 C 28 127, 29 129, 31 129
                 C 33 129, 34 127, 34 125
                 L 34 70 L 37 70 L 37 135
                 L 63 135 L 63 70 L 66 70
                 L 66 125
                 C 66 127, 67 129, 69 129
                 C 71 129, 72 127, 72 125
                 L 72 80 L 80 110
                 C 84 114, 88 110, 86 105
                 L 73 63
                 C 70 55, 67 49, 55 48 Z
                 
                 M 37 135 L 63 135 L 60 155 L 40 155 Z
                 
                 M 40 155
                 L 35 200
                 L 38 245
                 C 38 249, 43 249, 44 245
                 L 49 200 L 49 155 Z
                 
                 M 60 155
                 L 65 200
                 L 62 245
                 C 62 249, 57 249, 56 245
                 L 51 200 L 51 155 Z"
              fill="#18181b"
              stroke="var(--accent-green)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300 group-hover:stroke-[var(--accent-green)]/80"
            />

            {/* Glowing pins */}
            {sideMarkers.map((marker, index) => {
              const markerIndex = markers.findIndex((m) => m.id === marker.id) + 1;
              return (
                <g key={marker.id} className="cursor-pointer group/pin">
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r="6"
                    className="fill-red-500 stroke-white stroke-1"
                  />
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r="12"
                    className="fill-red-500/30 animate-ping opacity-75"
                  />
                  <text
                    x={marker.x}
                    y={marker.y + 2}
                    textAnchor="middle"
                    fontSize="7"
                    fontWeight="bold"
                    fill="white"
                    className="pointer-events-none select-none font-sans"
                  >
                    {markerIndex}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Front Outline */}
        <BodySilhouette side="front" />

        {/* Back Outline */}
        <BodySilhouette side="back" />

        {/* Marker Actions Control Panel */}
        <div className="flex-1 w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <AlertCircle size={16} className="text-[var(--accent-green)]" />
            <span>Problem Zones Body Map</span>
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            {!readOnly 
              ? "Click on any area of the body silhouettes (front/back) to add a marker. Then enter a short note."
              : "Body map of problem zones (pain points / movement restrictions)."}
          </p>

          {/* Prompt to Add Pin */}
          {showNoteInput && clickCoords && (
            <div className="p-3 bg-[var(--bg-primary)] border border-red-500/20 rounded-xl space-y-3 animate-fadeIn">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                NEW MARKER ({clickCoords.side === "front" ? "FRONT VIEW" : "BACK VIEW"})
              </div>
              <textarea
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="e.g., Pulling pain during extension..."
                className="w-full text-xs p-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:border-[var(--accent-green)] text-[var(--text-primary)] h-16 resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteInput(false);
                    setClickCoords(null);
                  }}
                  className="px-3 py-1.5 border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-md hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMarker}
                  disabled={!tempNote.trim()}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md font-bold disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* List of active pins */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] tracking-wider uppercase border-b border-[var(--border-primary)] pb-1.5">
              Marker List ({markers.length})
            </div>

            {markers.length === 0 ? (
              <div className="text-[11px] text-[var(--text-muted)] italic text-center py-4">
                No markers set
              </div>
            ) : (
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {markers.map((marker, index) => (
                  <div
                    key={marker.id}
                    className="p-2.5 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-xl flex items-start gap-3 group/item hover:border-[var(--border-active)]/30 transition-all"
                  >
                    <span className="w-5 h-5 flex items-center justify-center bg-red-500/20 text-red-400 font-sans text-[10px] font-black rounded-lg shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-[var(--text-secondary)] tracking-wider uppercase">
                          {marker.side === "front" ? "Front" : "Back"}
                        </span>
                        <span className="text-[8px] text-[var(--text-muted)]">
                          ({marker.x}%, {marker.y}%)
                        </span>
                      </div>
                      
                      {editingMarkerId === marker.id ? (
                        <div className="mt-1.5 space-y-2">
                          <textarea
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            className="w-full text-xs p-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] h-12 focus:outline-none focus:border-[var(--accent-green)]"
                          />
                          <div className="flex justify-end gap-1.5 text-[9px]">
                            <button
                              type="button"
                              onClick={() => setEditingMarkerId(null)}
                              className="px-2 py-1 border border-[var(--border-primary)] text-[var(--text-secondary)] rounded"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMarkerNote(marker.id)}
                              className="px-2 py-1 bg-[var(--accent-green)] text-black font-bold rounded"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-primary)] mt-0.5 break-words">
                          {marker.note}
                        </p>
                      )}
                    </div>

                    {!readOnly && editingMarkerId !== marker.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEditing(marker)}
                          className="p-1 hover:text-[var(--accent-green)] text-[var(--text-muted)] transition-colors"
                          title="Edit note"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMarker(marker.id)}
                          className="p-1 hover:text-red-500 text-[var(--text-muted)] transition-colors"
                          title="Delete marker"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
