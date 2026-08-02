"use client";

import React, { useState, useRef } from "react";
import { Plus, Trash2, Edit2, AlertCircle, ShieldCheck, Heart } from "lucide-react";

// OLD INTERFACES
export interface BodyMarker {
  id: string;
  x: number;
  y: number;
  side: "front" | "back";
  note: string;
  severity: "mild" | "moderate" | "severe";
}

// NEW INTERFACES
export interface BodyZoneEntry {
  zone_name: string;
  severity: "RED" | "ORANGE" | "YELLOW";
  notes: string;
}

interface BodyMapProps {
  // New Structured Mode Props
  zones?: BodyZoneEntry[];
  
  // Old Dynamic Mode Props
  markers?: BodyMarker[];
  
  onChange?: any;
  onChangeMarkers?: (markers: BodyMarker[]) => void;
  
  readOnly?: boolean;
}

const HOTSPOTS = [
  // Front hotspots
  { id: "neck_front", label: "Neck", x: 100, y: 80, side: "FRONT", zone: "Neck" },
  { id: "shoulder_l_front", label: "L Shoulder", x: 65, y: 110, side: "FRONT", zone: "Shoulder" },
  { id: "shoulder_r_front", label: "R Shoulder", x: 135, y: 110, side: "FRONT", zone: "Shoulder" },
  { id: "chest_front", label: "Chest", x: 100, y: 130, side: "FRONT", zone: "Chest" },
  { id: "hip_l_front", label: "L Hip", x: 75, y: 190, side: "FRONT", zone: "Hip" },
  { id: "hip_r_front", label: "R Hip", x: 125, y: 190, side: "FRONT", zone: "Hip" },
  { id: "groin_front", label: "Groin", x: 100, y: 200, side: "FRONT", zone: "Groin" },
  { id: "quad_l_front", label: "L Thigh/Quad", x: 80, y: 240, side: "FRONT", zone: "Leg" },
  { id: "quad_r_front", label: "R Thigh/Quad", x: 120, y: 240, side: "FRONT", zone: "Leg" },
  { id: "knee_l_front", label: "L Knee", x: 80, y: 280, side: "FRONT", zone: "Knee" },
  { id: "knee_r_front", label: "R Knee", x: 120, y: 280, side: "FRONT", zone: "Knee" },
  { id: "calf_l_front", label: "L Shin/Calf", x: 80, y: 315, side: "FRONT", zone: "Leg" },
  { id: "calf_r_front", label: "R Shin/Calf", x: 120, y: 315, side: "FRONT", zone: "Leg" },
  { id: "ankle_l_front", label: "L Ankle", x: 80, y: 350, side: "FRONT", zone: "Ankle" },
  { id: "ankle_r_front", label: "R Ankle", x: 120, y: 350, side: "FRONT", zone: "Ankle" },
  { id: "toe_l_front", label: "L Toe", x: 75, y: 380, side: "FRONT", zone: "Toe" },
  { id: "toe_r_front", label: "R Toe", x: 125, y: 380, side: "FRONT", zone: "Toe" },
  { id: "balance_front", label: "Core/Balance", x: 100, y: 160, side: "FRONT", zone: "Balance" },

  // Back hotspots
  { id: "neck_back", label: "Neck", x: 300, y: 80, side: "BACK", zone: "Neck" },
  { id: "shoulder_l_back", label: "L Shoulder", x: 265, y: 110, side: "BACK", zone: "Shoulder" },
  { id: "shoulder_r_back", label: "R Shoulder", x: 335, y: 110, side: "BACK", zone: "Shoulder" },
  { id: "back_upper", label: "Upper Back", x: 300, y: 130, side: "BACK", zone: "Back" },
  { id: "back_lower", label: "Lower Back", x: 300, y: 170, side: "BACK", zone: "Back" },
  { id: "hamstring_l_back", label: "L Hamstring", x: 280, y: 245, side: "BACK", zone: "Hamstring" },
  { id: "hamstring_r_back", label: "R Hamstring", x: 320, y: 245, side: "BACK", zone: "Hamstring" },
  { id: "knee_l_back", label: "L Knee Back", x: 280, y: 280, side: "BACK", zone: "Knee" },
  { id: "knee_r_back", label: "R Knee Back", x: 320, y: 280, side: "BACK", zone: "Knee" },
  { id: "calf_l_back", label: "L Calf", x: 280, y: 315, side: "BACK", zone: "Calf" },
  { id: "calf_r_back", label: "R Calf", x: 320, y: 315, side: "BACK", zone: "Calf" },
  { id: "ankle_l_back", label: "L Ankle Back", x: 280, y: 350, side: "BACK", zone: "Ankle" },
  { id: "ankle_r_back", label: "R Ankle Back", x: 320, y: 350, side: "BACK", zone: "Ankle" }
];

export default function BodyMap(props: BodyMapProps) {
  const { zones, onChange, markers, onChangeMarkers, readOnly = false } = props;

  // 1. CHECK IF IN OLD DYNAMIC MARKERS MODE
  if (markers !== undefined) {
    return <OldBodyMap markers={markers} onChange={onChangeMarkers || (props.onChange as any)} readOnly={readOnly} />;
  }

  // 2. NEW STRUCTURED ZONE MODE LOGIC
  return <NewBodyMap zones={zones || []} onChange={onChange} readOnly={readOnly} />;
}

// ==========================================
// NEW BODY MAP (ZONE-BASED STRUCTURED INTERACTIVE SILHOUETTE)
// ==========================================
function NewBodyMap({ zones = [], onChange, readOnly = false }: { zones: BodyZoneEntry[]; onChange?: (zones: BodyZoneEntry[]) => void; readOnly?: boolean }) {
  const [selectedHotspot, setSelectedHotspot] = useState<typeof HOTSPOTS[0] | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const [severity, setSeverity] = useState<"RED" | "ORANGE" | "YELLOW">("YELLOW");
  const [notes, setNotes] = useState("");

  const activeZoneMap = new Map(zones.map((z) => [z.zone_name, z]));

  const getSeverityColor = (sev: string) => {
    if (sev === "RED") return "#ef4444";
    if (sev === "ORANGE") return "#f59e0b";
    return "#eab308"; // YELLOW
  };

  const handleHotspotClick = (hs: typeof HOTSPOTS[0]) => {
    if (readOnly) return;
    setSelectedHotspot(hs);
    const existing = zones.find((z) => z.zone_name === hs.zone);
    if (existing) {
      setSeverity(existing.severity);
      setNotes(existing.notes);
    } else {
      setSeverity("YELLOW");
      setNotes("");
    }
  };

  const handleSaveZone = () => {
    if (!selectedHotspot || readOnly) return;
    const updated = zones.filter((z) => z.zone_name !== selectedHotspot.zone);
    updated.push({
      zone_name: selectedHotspot.zone,
      severity,
      notes
    });
    if (onChange) onChange(updated);
    setSelectedHotspot(null);
  };

  const handleRemoveZone = (zoneName: string) => {
    if (readOnly) return;
    const updated = zones.filter((z) => z.zone_name !== zoneName);
    if (onChange) onChange(updated);
    if (selectedHotspot && selectedHotspot.zone === zoneName) {
      setSelectedHotspot(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-bg-card/40 border border-border-primary/40 rounded-3xl p-6 relative w-full">
      {/* Visual Silhouette Column */}
      <div className="md:col-span-7 flex flex-col items-center justify-center bg-bg-secondary rounded-2xl p-4 border border-border-primary/50 relative min-h-[420px]">
        <div className="absolute top-4 left-4 text-[9px] font-black text-text-muted uppercase tracking-[3px]">
          Biomechanical Map
        </div>
        
        <svg viewBox="0 0 400 420" className="w-full max-w-[340px] h-auto select-none overflow-visible">
          <defs>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* FRONT SILHOUETTE */}
          <g stroke="var(--text-primary)" strokeOpacity="0.15" strokeWidth="2" fill="none">
            <circle cx="100" cy="50" r="16" />
            <line x1="100" y1="66" x2="100" y2="100" />
            <path d="M 70 100 L 130 100 L 120 190 L 80 190 Z" />
            <path d="M 70 100 L 50 150 L 45 200" />
            <path d="M 130 100 L 150 150 L 155 200" />
            <path d="M 85 190 L 80 280 L 80 350 L 70 380" />
            <path d="M 115 190 L 120 280 L 120 350 L 130 380" />
          </g>

          {/* BACK SILHOUETTE */}
          <g stroke="var(--text-primary)" strokeOpacity="0.15" strokeWidth="2" fill="none">
            <circle cx="300" cy="50" r="16" />
            <line x1="300" y1="66" x2="300" y2="100" />
            <path d="M 270 100 L 330 100 L 320 190 L 280 190 Z" strokeDasharray="3,3" />
            <line x1="300" y1="100" x2="300" y2="190" strokeDasharray="2,2" />
            <path d="M 270 100 L 250 150 L 245 200" />
            <path d="M 330 100 L 350 150 L 355 200" />
            <path d="M 285 190 L 280 280 L 280 350 L 275 358" />
            <path d="M 315 190 L 320 280 L 320 350 L 325 358" />
          </g>

          <text x="100" y="415" textAnchor="middle" fill="var(--text-muted)" opacity="0.5" fontSize="10" fontWeight="900" letterSpacing="2">FRONT</text>
          <text x="300" y="415" textAnchor="middle" fill="var(--text-muted)" opacity="0.5" fontSize="10" fontWeight="900" letterSpacing="2">BACK</text>

          {HOTSPOTS.map((hs) => {
            const entry = activeZoneMap.get(hs.zone);
            const isHovered = hoveredHotspot === hs.id;
            const isSelected = selectedHotspot?.id === hs.id;

            return (
              <g 
                key={hs.id} 
                className={readOnly ? "" : "cursor-pointer"}
                onClick={() => handleHotspotClick(hs)}
                onMouseEnter={() => setHoveredHotspot(hs.id)}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                <circle 
                  cx={hs.x} 
                  cy={hs.y} 
                  r={isSelected ? "11" : isHovered ? "9" : entry ? "8" : "5"} 
                  fill={entry ? getSeverityColor(entry.severity) : "var(--text-primary)"}
                  fillOpacity={entry ? 1 : 0.05}
                  stroke="var(--text-primary)"
                  strokeOpacity={isSelected ? 1 : isHovered ? 0.6 : entry ? 0.2 : 0.15}
                  strokeWidth={isSelected || isHovered ? "2.5" : "1.5"}
                  filter={entry ? (entry.severity === 'RED' ? 'url(#glow-red)' : entry.severity === 'ORANGE' ? 'url(#glow-orange)' : 'url(#glow-yellow)') : undefined}
                  className="transition-all duration-200"
                />
                {entry && <circle cx={hs.x} cy={hs.y} r="3" fill="var(--bg-primary)" className="animate-pulse" />}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Editor & Notes Sidebar Column */}
      <div className="md:col-span-5 flex flex-col justify-between">
        {!readOnly && selectedHotspot ? (
          <div className="space-y-4 p-5 bg-bg-secondary border border-border-primary/50 rounded-2xl flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[10px] font-black text-accent-green uppercase tracking-[2px]">
                  Configuring: {selectedHotspot.zone.toUpperCase()}
                </span>
                <button onClick={() => setSelectedHotspot(null)} className="text-text-muted hover:text-text-primary text-[9px] uppercase font-bold">
                  Cancel
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider">Severity Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["YELLOW", "ORANGE", "RED"] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      style={{ 
                        backgroundColor: severity === sev ? getSeverityColor(sev) + "25" : "transparent",
                        borderColor: severity === sev ? getSeverityColor(sev) : "var(--border-primary)",
                        color: severity === sev ? getSeverityColor(sev) : "#94a3b8"
                      }}
                      className="border py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider">Liaison Notes / Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="EX: MILD TIGHTNESS DURING HIP IR..."
                  rows={4}
                  className="w-full bg-bg-primary border border-border-primary/50 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all outline-none resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
              {activeZoneMap.has(selectedHotspot.zone) && (
                <button
                  type="button"
                  onClick={() => handleRemoveZone(selectedHotspot.zone)}
                  className="py-3 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveZone}
                className={`py-3 bg-accent-green text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-90 ${activeZoneMap.has(selectedHotspot.zone) ? '' : 'col-span-2'}`}
              >
                Commit Zone
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <AlertCircle size={14} className="text-gray-400" />
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[3px]">Active Problem Zones</span>
              </div>
              
              {zones.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-bg-secondary rounded-xl border border-border-primary/50 border-dashed">
                  <ShieldCheck size={28} className="text-accent-green mb-2" />
                  <span className="text-[9px] font-black text-accent-green uppercase tracking-[2px]">Neutral Telemetry</span>
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-1">No biomechanical anomalies flagged</span>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1 scrollbar-hide">
                  {zones.map((zone) => (
                    <div 
                      key={zone.zone_name}
                      style={{ borderLeft: `3px solid ${getSeverityColor(zone.severity)}` }}
                      className="p-3 bg-bg-secondary border border-border-primary/50 rounded-xl flex items-start justify-between gap-3 relative group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-text-primary uppercase tracking-wider">{zone.zone_name}</span>
                          <span 
                            style={{ 
                              color: getSeverityColor(zone.severity),
                              backgroundColor: getSeverityColor(zone.severity) + "15"
                            }} 
                            className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                          >
                            {zone.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium leading-normal">{zone.notes || "No details provided"}</p>
                      </div>
                      
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveZone(zone.zone_name)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all p-1 self-center"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {!readOnly && (
              <div className="bg-[#22c55e]/5 border border-[#22c55e]/15 p-4 rounded-xl mt-4">
                <span className="text-[8px] font-black text-[#22c55e] uppercase tracking-[2px] block mb-1">Coach Guide:</span>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wide leading-relaxed block">
                  Click on any nodes on the silhouette to customize focus zones, injury severity indicators, and liaison notes.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// OLD BODY MAP (DYNAMIC SCAN POINT PIN DROPS FOR FUNCTIONAL CHECKUPS)
// ==========================================
function OldBodyMap({ markers = [], onChange, readOnly = false }: { markers: BodyMarker[]; onChange?: (markers: BodyMarker[]) => void; readOnly?: boolean }) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("moderate");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number; side: "front" | "back"; regionName?: string } | null>(null);

  const frontSvgRef = useRef<SVGSVGElement>(null);
  const backSvgRef = useRef<SVGSVGElement>(null);

  const BODY_REGIONS = [
    { label: "Neck", side: "front", x: 50, y: 32, note: "Neck / Cervical region" },
    { label: "L Shoulder", side: "front", x: 28, y: 60, note: "Left Shoulder" },
    { label: "R Shoulder", side: "front", x: 72, y: 60, note: "Right Shoulder" },
    { label: "Chest", side: "front", x: 50, y: 78, note: "Chest" },
    { label: "Core / Abdomen", side: "front", x: 50, y: 110, note: "Core / Abdominal area" },
    { label: "L Thigh / Quad", side: "front", x: 42, y: 175, note: "Left Thigh / Quad" },
    { label: "R Thigh / Quad", side: "front", x: 58, y: 175, note: "Right Thigh / Quad" },
    { label: "L Knee", side: "front", x: 41, y: 205, note: "Left Knee" },
    { label: "R Knee", side: "front", x: 59, y: 205, note: "Right Knee" },
    { label: "L Calf / Shin", side: "front", x: 40, y: 228, note: "Left Calf / Shin" },
    { label: "R Calf / Shin", side: "front", x: 60, y: 228, note: "Right Calf / Shin" },
    { label: "L Ankle", side: "front", x: 38, y: 246, note: "Left Ankle" },
    { label: "R Ankle", side: "front", x: 62, y: 246, note: "Right Ankle" },

    { label: "Upper Back", side: "back", x: 50, y: 78, note: "Upper Back / Thoracic" },
    { label: "Lower Back", side: "back", x: 50, y: 120, note: "Lower Back / Lumbar" },
    { label: "L Hamstring", side: "back", x: 42, y: 175, note: "Left Hamstring" },
    { label: "R Hamstring", side: "back", x: 58, y: 175, note: "Right Hamstring" },
    { label: "L Knee (Back)", side: "back", x: 41, y: 205, note: "Left Knee (Back)" },
    { label: "R Knee (Back)", side: "back", x: 59, y: 205, note: "Right Knee (Back)" },
    { label: "L Calf (Back)", side: "back", x: 40, y: 228, note: "Left Calf (Back)" },
    { label: "R Calf (Back)", side: "back", x: 60, y: 228, note: "Right Calf (Back)" },
  ] as const;

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>, side: "front" | "back") => {
    if (readOnly) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    let x = 50;
    let y = 100;
    try {
      const cursorPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      if (cursorPoint) {
        x = parseFloat(cursorPoint.x.toFixed(1));
        y = parseFloat(cursorPoint.y.toFixed(1));
      }
    } catch {
      const rect = svg.getBoundingClientRect();
      x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
      y = parseFloat((((e.clientY - rect.top) / rect.height) * 255).toFixed(1));
    }

    setClickCoords({ x, y, side });
    setTempNote("");
    setSeverity("moderate");
    setShowNoteInput(true);
    setEditingMarkerId(null);
  };

  const handleSelectPresetRegion = (regionLabel: string) => {
    const found = BODY_REGIONS.find((r) => r.label === regionLabel);
    if (!found) return;
    setClickCoords({ x: found.x, y: found.y, side: found.side as "front" | "back", regionName: found.label });
    setTempNote(`${found.note} problem`);
    setSeverity("moderate");
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
      severity: severity,
    };

    const updated = [...markers, newMarker];
    if (onChange) onChange(updated);

    setShowNoteInput(false);
    setClickCoords(null);
    setTempNote("");
    setSeverity("moderate");
  };

  const handleUpdateMarkerNote = (id: string) => {
    if (!tempNote.trim()) return;

    const updated = markers.map((m) =>
      m.id === id ? { ...m, note: tempNote.trim(), severity: severity } : m
    );
    if (onChange) onChange(updated);

    setEditingMarkerId(null);
    setTempNote("");
    setSeverity("moderate");
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
    setSeverity(marker.severity || "moderate");
    setShowNoteInput(false);
  };

  const BodySilhouette = ({ side }: { side: "front" | "back" }) => {
    const svgRef = side === "front" ? frontSvgRef : backSvgRef;
    const sideMarkers = markers.filter((m) => m.side === side);

    return (
      <div className="relative flex flex-col items-center">
        <h4 className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-3">
          {side === "front" ? "Front View" : "Back View"}
        </h4>
        <div className="relative border border-[var(--border-primary)] bg-[var(--bg-primary)]/50 rounded-2xl p-4 w-full max-w-[220px] flex justify-center items-center group overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(var(--accent-green)_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <svg
            ref={svgRef}
            viewBox="0 0 100 255"
            className={`w-full max-w-[180px] h-auto select-none relative ${!readOnly ? "cursor-crosshair" : ""}`}
            onClick={(e) => handleSvgClick(e, side)}
          >
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

            {/* Interactive Hotspot Nodes */}
            {!readOnly && BODY_REGIONS.filter(r => r.side === side).map((reg) => (
              <circle
                key={reg.label}
                cx={reg.x}
                cy={reg.y}
                r="3"
                className="fill-[var(--accent-green)]/30 hover:fill-[var(--accent-green)] hover:r-[5] transition-all cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPresetRegion(reg.label);
                }}
              >
                <title>Select {reg.label}</title>
              </circle>
            ))}

            {sideMarkers.map((marker) => {
              const markerIndex = markers.findIndex((m) => m.id === marker.id) + 1;
              const severityColor = 
                marker.severity === "severe" 
                  ? "#ef4444" 
                  : marker.severity === "mild"
                  ? "#eab308" 
                  : "#f97316";

              const markerY = marker.y <= 100 ? parseFloat((marker.y * 2.55).toFixed(1)) : marker.y;

              return (
                <g key={marker.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); startEditing(marker); }}>
                  <circle cx={marker.x} cy={markerY} r="5" fill={severityColor} stroke="#ffffff" strokeWidth="1" />
                  <text x={marker.x} y={markerY - 8} textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
      <div className="md:col-span-7 flex flex-col sm:flex-row gap-4 justify-center items-center">
        <BodySilhouette side="front" />
        <BodySilhouette side="back" />
      </div>

      <div className="md:col-span-5 flex flex-col justify-between min-w-0">
        <div>
          {!readOnly && (
            <div className="mb-4">
              <label className="block text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">
                Quick Select Region
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) handleSelectPresetRegion(e.target.value);
                }}
                value=""
                className="w-full text-xs p-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-green)] cursor-pointer"
              >
                <option value="" disabled>-- Click Silhouette or Select Body Part --</option>
                {BODY_REGIONS.map((r) => (
                  <option key={r.label} value={r.label}>
                    {r.label} ({r.side.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!readOnly && showNoteInput && clickCoords && (
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl mb-6 space-y-4 shadow-xl animate-fade-in">
              <div className="flex justify-between items-start gap-2 text-[10px] font-black uppercase text-[var(--accent-green)] tracking-wider">
                <span className="leading-tight">
                  Flag: {clickCoords.regionName ? clickCoords.regionName : `${clickCoords.side.toUpperCase()} (${clickCoords.x}%, ${clickCoords.y}%)`}
                </span>
                <button type="button" onClick={() => setShowNoteInput(false)} className="text-[9px] text-[var(--text-muted)] hover:text-white shrink-0">Cancel</button>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-widest">Severity</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["mild", "moderate", "severe"] as const).map((sev) => {
                    const active = severity === sev;
                    const color = sev === "severe" ? "bg-red-500" : sev === "moderate" ? "bg-orange-500" : "bg-yellow-500";
                    return (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setSeverity(sev)}
                        className={`py-2 px-1 border rounded-xl text-[9px] font-black uppercase flex items-center justify-center transition-all truncate ${
                          active 
                            ? `${color} text-white border-transparent shadow-md`
                            : `bg-transparent text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-active)]`
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-widest">Diagnostics / Notes</label>
                <textarea
                  placeholder="Describe biomechanical issues..."
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  className="w-full text-xs p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] h-20 focus:outline-none focus:border-[var(--accent-green)] resize-none"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--border-primary)]">
                <button
                  type="button"
                  onClick={handleSaveMarker}
                  disabled={!tempNote.trim()}
                  className="w-full py-2.5 bg-[var(--accent-green)] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 hover:bg-[var(--accent-green)]/90 transition-all shadow-md"
                >
                  Add Marker
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] tracking-wider uppercase border-b border-[var(--border-primary)] pb-1.5">
              Marker List ({markers.length})
            </div>

            {markers.length === 0 ? (
              <div className="text-[11px] text-[var(--text-muted)] italic text-center py-4">No markers set</div>
            ) : (
              <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {markers.map((marker, index) => (
                  <div key={marker.id} className="p-3 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-xl flex items-start gap-2.5 group/item hover:border-[var(--border-active)]/30 transition-all min-w-0">
                    <span className="w-5 h-5 flex items-center justify-center font-sans text-[10px] font-black rounded-lg shrink-0 mt-0.5 text-white shadow-sm" style={{ backgroundColor: marker.severity === "severe" ? "#ef4444" : marker.severity === "mild" ? "#eab308" : "#f97316" }}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black text-[var(--text-secondary)] tracking-wider uppercase">{marker.side}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border" style={{ borderColor: marker.severity === "severe" ? "#fecaca" : marker.severity === "mild" ? "#fef08a" : "#fed7aa", color: marker.severity === "severe" ? "#ef4444" : marker.severity === "mild" ? "#eab308" : "#f97316" }}>
                          {marker.severity}
                        </span>
                      </div>
                      {editingMarkerId === marker.id ? (
                        <div className="mt-2 space-y-2">
                          <div className="grid grid-cols-3 gap-1">
                            {(["mild", "moderate", "severe"] as const).map((sev) => {
                              const active = severity === sev;
                              const color = sev === "severe" ? "bg-red-500" : sev === "moderate" ? "bg-orange-500" : "bg-yellow-500";
                              return (
                                <button type="button" key={sev} onClick={() => setSeverity(sev)} className={`py-1 border rounded-md text-[8px] font-black uppercase flex items-center justify-center transition-all truncate ${active ? `${color} text-white border-transparent` : `bg-transparent text-[var(--text-secondary)] border-[var(--border-primary)]`}`}>{sev}</button>
                              );
                            })}
                          </div>
                          <textarea value={tempNote} onChange={(e) => setTempNote(e.target.value)} className="w-full text-xs p-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] h-14 focus:outline-none focus:border-[var(--accent-green)] resize-none" />
                          <div className="flex justify-end gap-1.5 text-[9px]">
                            <button type="button" onClick={() => setEditingMarkerId(null)} className="px-2 py-1 border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-md">Cancel</button>
                            <button type="button" onClick={() => handleUpdateMarkerNote(marker.id)} className="px-2.5 py-1 bg-[var(--accent-green)] text-black font-bold rounded-md">Save</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-primary)] mt-1 break-all whitespace-pre-wrap leading-normal">{marker.note}</p>
                      )}
                    </div>
                    {!readOnly && editingMarkerId !== marker.id && (
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover/item:opacity-100 transition-opacity">
                        <button type="button" onClick={() => startEditing(marker)} className="p-1 hover:text-[var(--accent-green)] text-[var(--text-muted)] transition-colors"><Edit2 size={12} /></button>
                        <button type="button" onClick={() => handleDeleteMarker(marker.id)} className="p-1 hover:text-red-500 text-[var(--text-muted)] transition-colors"><Trash2 size={12} /></button>
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
