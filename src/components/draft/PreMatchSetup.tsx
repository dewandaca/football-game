'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Swords, Play, Users, ChevronDown, Zap,
  Target, ArrowRight, RotateCcw, Settings2, Crosshair,
  Sparkles, Move, Check,
} from 'lucide-react';
import Button from '@/components/common/Button';
import {
  FootballPlayer,
  FormationId,
  TacticalSetup,
  PlayerSlotAssignment,
  DEFAULT_TACTICS,
} from '@/types/game';
import { getAllFormations, autoAssignPlayers, getFormation } from '@/lib/matchEngine/formations';
import { getPositionalFit, getPositionCategory } from '@/lib/matchEngine/deriveAttributes';
import { getPositionColor } from '@/lib/utils';

interface PreMatchSetupProps {
  playerKey: 'player1' | 'player2';
  playerName: string;
  squad: FootballPlayer[];
  formation: FormationId;
  tactics: TacticalSetup;
  assignments: PlayerSlotAssignment[];
  onFormationChange: (formation: FormationId) => void;
  onTacticsChange: (tactics: Partial<TacticalSetup>) => void;
  onAssignmentsChange: (assignments: PlayerSlotAssignment[]) => void;
  color: 'blue' | 'red';
}

function TeamSetupPanel({
  playerName, squad, formation, tactics, assignments,
  onFormationChange, onTacticsChange, onAssignmentsChange, color,
}: PreMatchSetupProps) {
  const formations = useMemo(() => getAllFormations(), []);
  const currentFormation = useMemo(() => getFormation(formation), [formation]);
  const accentColor = color === 'blue' ? '#3B82F6' : '#EF4444';
  const emoji = color === 'blue' ? '🔵' : '🔴';

  // Interaction states: hover, drag & drop, click-to-swap
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  // Auto-assign when formation changes or no assignments exist
  useEffect(() => {
    if (squad.length === 11 && (assignments.length === 0 || assignments.length !== 11)) {
      const auto = autoAssignPlayers(squad, formation);
      onAssignmentsChange(auto);
    }
  }, [formation, squad, assignments.length, onAssignmentsChange]);

  // Build player lookup
  const playerMap = useMemo(() => {
    const map = new Map<string, FootballPlayer>();
    squad.forEach(p => map.set(p.id, p));
    return map;
  }, [squad]);

  // Swap players between two slots
  const handleSwapSlots = (slotA: number, slotB: number) => {
    if (slotA === slotB) return;
    const assignA = assignments.find(a => a.slotIndex === slotA);
    const assignB = assignments.find(a => a.slotIndex === slotB);
    if (!assignA || !assignB) return;

    const newAssignments = assignments.map(a => {
      if (a.slotIndex === slotA) {
        return { ...a, playerId: assignB.playerId };
      }
      if (a.slotIndex === slotB) {
        return { ...a, playerId: assignA.playerId };
      }
      return a;
    });

    onAssignmentsChange(newAssignments);
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 ring-1 ring-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10" style={{ backgroundColor: `${accentColor}15` }}>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: accentColor }}>
          {emoji} {playerName}
          <span className="text-xs font-normal text-slate-400">({squad.length}/11 pemain)</span>
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Formation Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Settings2 size={12} /> Formasi
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {formations.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  onFormationChange(f.id);
                  const auto = autoAssignPlayers(squad, f.id);
                  onAssignmentsChange(auto);
                }}
                className={`rounded-lg py-2 text-xs font-bold font-mono transition-all ${
                  formation === f.id
                    ? 'text-slate-950 shadow-lg'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
                style={formation === f.id ? { backgroundColor: accentColor } : {}}
              >
                {f.id}
              </button>
            ))}
          </div>
        </div>

        {/* Formation Pitch & Interactive Slots */}
        <div className="space-y-2">
          <div
            className="relative rounded-xl overflow-visible select-none"
            style={{
              background: 'linear-gradient(180deg, #14532d 0%, #166534 50%, #14532d 100%)',
              paddingBottom: '70%',
            }}
          >
            {/* Pitch markings SVG */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none rounded-xl overflow-hidden" viewBox="0 0 100 70" preserveAspectRatio="none">
              <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />
              <circle cx="50" cy="35" r="8" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />
              <rect x="25" y="0" width="50" height="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />
              <rect x="25" y="56" width="50" height="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />
            </svg>

            {/* Player dots with Drag-and-Drop & Hover Tooltip */}
            {currentFormation.slots.map((slot, idx) => {
              const assignment = assignments.find(a => a.slotIndex === idx);
              const player = assignment ? playerMap.get(assignment.playerId) : null;
              // Map: formation y 0-100 → visual y 70-0 (top=attack, bottom=defense)
              const visualY = 70 - (slot.y / 100 * 60 + 5);
              const visualX = slot.x;
              const posColor = getPositionColor(slot.position);

              const isSelected = selectedSlot === idx;
              const isDragged = draggedSlot === idx;
              const isDragOver = dragOverSlot === idx;
              const isHovered = hoveredSlot === idx;

              // Positional fit calculation
              const fit = player ? getPositionalFit(player.position, slot.position) : 1.0;

              return (
                <div
                  key={`${slot.position}-${idx}`}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', idx.toString());
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedSlot(idx);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverSlot !== idx) setDragOverSlot(idx);
                  }}
                  onDragLeave={() => {
                    if (dragOverSlot === idx) setDragOverSlot(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                    if (!isNaN(sourceIdx)) {
                      handleSwapSlots(sourceIdx, idx);
                    }
                    setDraggedSlot(null);
                    setDragOverSlot(null);
                  }}
                  onDragEnd={() => {
                    setDraggedSlot(null);
                    setDragOverSlot(null);
                  }}
                  onClick={() => {
                    if (selectedSlot === null) {
                      setSelectedSlot(idx);
                    } else if (selectedSlot === idx) {
                      setSelectedSlot(null);
                    } else {
                      handleSwapSlots(selectedSlot, idx);
                      setSelectedSlot(null);
                    }
                  }}
                  onMouseEnter={() => setHoveredSlot(idx)}
                  onMouseLeave={() => setHoveredSlot(null)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing transition-transform ${
                    isDragged ? 'opacity-40 scale-95' :
                    isDragOver ? 'scale-125 z-30' :
                    isSelected ? 'scale-115 z-20' :
                    isHovered ? 'scale-110 z-20' : 'z-10'
                  }`}
                  style={{ left: `${visualX}%`, top: `${(visualY / 70) * 100}%` }}
                >
                  {/* Player Dot Circle */}
                  <div
                    className={`relative h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-slate-950 shadow-md transition-all ${
                      isDragOver ? 'ring-4 ring-amber-400 animate-pulse shadow-amber-400/50' :
                      isSelected ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/50' :
                      'ring-1 ring-white/30'
                    }`}
                    style={{ backgroundColor: accentColor }}
                  >
                    {player ? player.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}

                    {/* Small fit indicator dot */}
                    {player && fit < 0.85 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-slate-900" />
                    )}
                  </div>

                  {/* Slot Position Tag */}
                  <span
                    className="text-[6px] sm:text-[7px] font-bold px-1 rounded shadow-sm"
                    style={{ color: posColor, backgroundColor: `${posColor}25` }}
                  >
                    {slot.position}
                  </span>

                  {/* Hover Tooltip Card */}
                  <AnimatePresence>
                    {isHovered && player && (
                      <motion.div
                        initial={{ opacity: 0, y: visualY < 35 ? -4 : 4, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute z-50 pointer-events-none w-44 sm:w-48 rounded-xl bg-slate-950/95 p-2.5 shadow-2xl ring-1 ring-white/20 backdrop-blur-md text-left ${
                          visualY < 35 ? 'top-full mt-2' : 'bottom-full mb-2'
                        } ${visualX > 65 ? '-right-2' : visualX < 35 ? '-left-2' : '-translate-x-1/2 left-1/2'}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-white text-xs truncate">{player.name}</span>
                          <span className="font-mono text-[10px] font-black text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                            ⭐ {player.rating}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1.5">
                          <span className="truncate">{player.club}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400">Rp {player.price}M</span>
                        </div>

                        {(() => {
                          const categoryLabels: Record<string, string> = {
                            goalkeeper: 'Kiper',
                            defender: 'Bek',
                            midfielder: 'Gelandang',
                            attacker: 'Penyerang',
                          };
                          const natCat = categoryLabels[getPositionCategory(player.position)] || 'Pemain';
                          const slotCat = categoryLabels[getPositionCategory(slot.position)] || 'Pemain';
                          const penalty = Math.max(0, Math.round((1 - fit) * 100));

                          return (
                            <>
                              <div className="border-t border-white/10 pt-1.5 flex items-center justify-between text-[9px]">
                                <div>
                                  <span className="text-slate-500">Posisi: </span>
                                  <span className="font-bold text-white">{player.position}</span>
                                  <span className="text-slate-400 text-[8px] ml-1">({natCat})</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-500">Slot: </span>
                                  <span className="font-bold" style={{ color: posColor }}>{slot.position}</span>
                                  <span className="text-slate-400 text-[8px]">({slotCat})</span>
                                </div>
                              </div>

                              {/* Positional Fit indicator */}
                              <div className="mt-1.5 pt-1.5 border-t border-white/5 flex flex-col gap-1">
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="text-slate-400">Efektivitas:</span>
                                  <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] ${
                                    fit >= 1.0 ? 'text-emerald-400 bg-emerald-500/20' :
                                    fit >= 0.85 ? 'text-amber-400 bg-amber-500/20' :
                                    'text-red-400 bg-red-500/20'
                                  }`}>
                                    {fit >= 1.0 ? '✓ 100% Alami' :
                                     fit >= 0.85 ? `${Math.round(fit * 100)}% (Penalti -${penalty}%)` :
                                     `⚠ ${Math.round(fit * 100)}% (Penalti -${penalty}%)`}
                                  </span>
                                </div>
                                {penalty > 0 && (
                                  <p className="text-[8px] text-slate-400 leading-tight">
                                    {natCat} bermain di posisi {slotCat}. Atribut berkurang {penalty}%.
                                  </p>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Interactive Helper Bar */}
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-white/5 text-[10px]">
            {selectedSlot !== null ? (
              <div className="flex items-center justify-between gap-2 text-amber-300">
                <span className="truncate">
                  Dipilih: <b>{playerMap.get(assignments.find(a => a.slotIndex === selectedSlot)?.playerId || '')?.name}</b>
                </span>
                <span className="shrink-0 text-[9px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse font-semibold">
                  Klik pemain lain untuk tukar
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-amber-400 font-bold">💡 Tips:</span>
                <span>Hover untuk nama/info • Drag & drop atau klik 2 pemain untuk tukar posisi</span>
              </div>
            )}
          </div>
        </div>

        {/* Tactics */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Crosshair size={12} /> Taktik
          </label>

          <TacticSelect
            label="Mentalitas"
            value={tactics.mentality}
            options={[
              { value: 'defensive', label: '🛡️ Bertahan' },
              { value: 'balanced', label: '⚖️ Seimbang' },
              { value: 'attacking', label: '⚔️ Menyerang' },
            ]}
            onChange={v => onTacticsChange({ mentality: v as TacticalSetup['mentality'] })}
            accent={accentColor}
          />

          <TacticSelect
            label="Gaya Umpan"
            value={tactics.passingStyle}
            options={[
              { value: 'short', label: '📐 Pendek' },
              { value: 'mixed', label: '🔄 Campuran' },
              { value: 'direct', label: '🎯 Langsung' },
            ]}
            onChange={v => onTacticsChange({ passingStyle: v as TacticalSetup['passingStyle'] })}
            accent={accentColor}
          />

          <TacticSelect
            label="Tempo"
            value={tactics.tempo}
            options={[
              { value: 'slow', label: '🐢 Lambat' },
              { value: 'normal', label: '🏃 Normal' },
              { value: 'fast', label: '⚡ Cepat' },
            ]}
            onChange={v => onTacticsChange({ tempo: v as TacticalSetup['tempo'] })}
            accent={accentColor}
          />

          <TacticSelect
            label="Pressing"
            value={tactics.pressing}
            options={[
              { value: 'low', label: '😌 Rendah' },
              { value: 'medium', label: '🏋️ Sedang' },
              { value: 'high', label: '🔥 Tinggi' },
            ]}
            onChange={v => onTacticsChange({ pressing: v as TacticalSetup['pressing'] })}
            accent={accentColor}
          />

          <TacticSelect
            label="Garis Pertahanan"
            value={tactics.defensiveLine}
            options={[
              { value: 'deep', label: '🧱 Dalam' },
              { value: 'normal', label: '📏 Normal' },
              { value: 'high', label: '⬆️ Tinggi' },
            ]}
            onChange={v => onTacticsChange({ defensiveLine: v as TacticalSetup['defensiveLine'] })}
            accent={accentColor}
          />

          <TacticSelect
            label="Fokus Serangan"
            value={tactics.attackingFocus}
            options={[
              { value: 'left', label: '⬅️ Kiri' },
              { value: 'center', label: '⏺️ Tengah' },
              { value: 'right', label: '➡️ Kanan' },
              { value: 'mixed', label: '🔄 Campuran' },
            ]}
            onChange={v => onTacticsChange({ attackingFocus: v as TacticalSetup['attackingFocus'] })}
            accent={accentColor}
          />

          {/* Counter Attack Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2.5 ring-1 ring-white/5">
            <span className="text-xs font-medium text-slate-300">⚡ Counter Attack</span>
            <button
              onClick={() => onTacticsChange({ counterAttack: !tactics.counterAttack })}
              className={`relative h-6 w-11 rounded-full transition-all ${
                tactics.counterAttack ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  tactics.counterAttack ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TacticSelect({
  label, value, options, onChange, accent,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  accent: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg py-1.5 text-[10px] sm:text-xs font-semibold transition-all ${
              value === opt.value
                ? 'text-slate-950 shadow'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
            style={value === opt.value ? { backgroundColor: accent } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// MAIN PRE-MATCH SETUP COMPONENT
// =====================================================

interface PreMatchSetupScreenProps {
  player1Name: string;
  player2Name: string;
  player1Squad: FootballPlayer[];
  player2Squad: FootballPlayer[];
  formation1: FormationId;
  formation2: FormationId;
  tactics1: TacticalSetup;
  tactics2: TacticalSetup;
  assignments1: PlayerSlotAssignment[];
  assignments2: PlayerSlotAssignment[];
  onFormationChange: (playerKey: 'player1' | 'player2', formation: FormationId) => void;
  onTacticsChange: (playerKey: 'player1' | 'player2', tactics: Partial<TacticalSetup>) => void;
  onAssignmentsChange: (playerKey: 'player1' | 'player2', assignments: PlayerSlotAssignment[]) => void;
  onStartMatch: () => void;
  onResetDraft: () => void;
}

export default function PreMatchSetup({
  player1Name, player2Name,
  player1Squad, player2Squad,
  formation1, formation2,
  tactics1, tactics2,
  assignments1, assignments2,
  onFormationChange, onTacticsChange, onAssignmentsChange,
  onStartMatch, onResetDraft,
}: PreMatchSetupScreenProps) {
  const [activeTab, setActiveTab] = useState<'player1' | 'player2'>('player1');

  return (
    <div className="min-h-[calc(100vh-64px)] pb-12">
      {/* Header */}
      <div className="text-center py-6 px-4 space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
          <Swords size={14} />
          PERSIAPAN PERTANDINGAN
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">
          Susun Formasi & Taktik
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Atur formasi dan taktik untuk kedua tim sebelum memulai pertandingan. Pilih formasi, tentukan gaya bermain, dan siapkan strategi terbaikmu!
        </p>
      </div>

      {/* Tab Selector (Mobile) */}
      <div className="px-4 mb-4 md:hidden">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900 p-1 ring-1 ring-white/10">
          <button
            onClick={() => setActiveTab('player1')}
            className={`rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === 'player1'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔵 {player1Name}
          </button>
          <button
            onClick={() => setActiveTab('player2')}
            className={`rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === 'player2'
                ? 'bg-red-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔴 {player2Name}
          </button>
        </div>
      </div>

      {/* Setup Panels */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player 1 Panel */}
          <div className={`${activeTab === 'player2' ? 'hidden md:block' : ''}`}>
            <TeamSetupPanel
              playerKey="player1"
              playerName={player1Name}
              squad={player1Squad}
              formation={formation1}
              tactics={tactics1}
              assignments={assignments1}
              onFormationChange={(f) => onFormationChange('player1', f)}
              onTacticsChange={(t) => onTacticsChange('player1', t)}
              onAssignmentsChange={(a) => onAssignmentsChange('player1', a)}
              color="blue"
            />
          </div>

          {/* Player 2 Panel */}
          <div className={`${activeTab === 'player1' ? 'hidden md:block' : ''}`}>
            <TeamSetupPanel
              playerKey="player2"
              playerName={player2Name}
              squad={player2Squad}
              formation={formation2}
              tactics={tactics2}
              assignments={assignments2}
              onFormationChange={(f) => onFormationChange('player2', f)}
              onTacticsChange={(t) => onTacticsChange('player2', t)}
              onAssignmentsChange={(a) => onAssignmentsChange('player2', a)}
              color="red"
            />
          </div>
        </div>

        {/* VS Banner */}
        <div className="my-6 text-center">
          <div className="inline-flex items-center gap-4 rounded-2xl bg-slate-900/80 px-6 py-3 ring-1 ring-white/10">
            <div className="text-sm font-bold text-blue-400">🔵 {player1Name}</div>
            <div className="text-xs font-bold text-slate-500 font-mono bg-slate-800 px-3 py-1 rounded-lg">
              {formation1}
            </div>
            <div className="text-lg font-black text-amber-400">VS</div>
            <div className="text-xs font-bold text-slate-500 font-mono bg-slate-800 px-3 py-1 rounded-lg">
              {formation2}
            </div>
            <div className="text-sm font-bold text-red-400">{player2Name} 🔴</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" variant="primary" onClick={onStartMatch}>
            <Play size={18} />
            Mulai Pertandingan!
            <ArrowRight size={16} />
          </Button>
          <Button size="md" variant="ghost" onClick={onResetDraft}>
            <RotateCcw size={14} />
            Kembali ke Draft
          </Button>
        </div>
      </div>
    </div>
  );
}
