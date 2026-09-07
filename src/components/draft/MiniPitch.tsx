'use client';

import { motion } from 'framer-motion';
import { FootballPlayer } from '@/types/game';
import { getPositionColor } from '@/lib/utils';

// 4-3-3 formation layout: [row, col] grid positions (0-indexed, 5 cols)
const FORMATION_LAYOUT: { position: string; row: number; col: number }[] = [
  { position: 'GK', row: 5, col: 2 },
  { position: 'LB', row: 4, col: 0 },
  { position: 'CB', row: 4, col: 1 },
  { position: 'CB', row: 4, col: 3 },
  { position: 'RB', row: 4, col: 4 },
  { position: 'CM', row: 2, col: 0 },
  { position: 'CDM', row: 3, col: 2 },
  { position: 'CM', row: 2, col: 4 },
  { position: 'LW', row: 1, col: 0 },
  { position: 'ST', row: 0, col: 2 },
  { position: 'RW', row: 1, col: 4 },
];

interface MiniPitchProps {
  squad: FootballPlayer[];
  label: string;
  color: 'blue' | 'red';
}

export default function MiniPitch({ squad, label, color }: MiniPitchProps) {
  const colorClass = color === 'blue' ? '#3B82F6' : '#EF4444';

  // Map squad by position index (in order of FORMATION_LAYOUT)
  const squadBySlot: (FootballPlayer | null)[] = FORMATION_LAYOUT.map((slot, i) => {
    // Find the i-th player that matches the position
    const positionMatches = squad.filter((p) => p.position === slot.position);
    // Count how many of this position appeared before in FORMATION_LAYOUT
    const prevCount = FORMATION_LAYOUT.slice(0, i).filter((s) => s.position === slot.position).length;
    return positionMatches[prevCount] ?? null;
  });

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-white/10">
      {/* Header */}
      <div
        className="px-3 py-2 text-xs font-bold text-center"
        style={{ backgroundColor: `${colorClass}20`, color: colorClass }}
      >
        {color === 'blue' ? '🔵' : '🔴'} {label} ({squad.length}/11)
      </div>

      {/* Pitch */}
      <div
        className="relative"
        style={{
          background: 'linear-gradient(180deg, #14532d 0%, #166534 50%, #14532d 100%)',
          paddingBottom: '140%',
        }}
      >
        {/* Pitch markings */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 140" preserveAspectRatio="none">
          {/* Center line */}
          <line x1="0" y1="70" x2="100" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          {/* Center circle */}
          <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          {/* Penalty boxes */}
          <rect x="20" y="0" width="60" height="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <rect x="20" y="118" width="60" height="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          {/* 6-yard boxes */}
          <rect x="35" y="0" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <rect x="35" y="130" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        </svg>

        {/* Player slots */}
        {FORMATION_LAYOUT.map((slot, i) => {
          const player = squadBySlot[i];
          const xPct = (slot.col / 4) * 80 + 10; // 10% to 90%
          const yPct = (slot.row / 5) * 80 + 8;  // 8% to 88%
          const posColor = getPositionColor(slot.position);

          return (
            <div
              key={`${slot.position}-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
            >
              {player ? (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-slate-950 shadow-lg ring-2 ring-white/30"
                    style={{ backgroundColor: colorClass }}
                  >
                    {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div
                    className="rounded px-1 py-0.5 text-center"
                    style={{ backgroundColor: `${posColor}30` }}
                  >
                    <span className="block text-center font-mono text-[7px] font-bold leading-none" style={{ color: posColor }}>
                      {slot.position}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5">
                    <span className="text-[8px] text-white/30">?</span>
                  </div>
                  <span className="text-[7px] font-bold text-white/20">{slot.position}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
