'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FootballPlayer, FormationId } from '@/types/game';
import { getPositionColor } from '@/lib/utils';
import { getFormation } from '@/lib/matchEngine/formations';

interface MiniPitchProps {
  squad: FootballPlayer[];
  label: string;
  color: 'blue' | 'red';
  formation?: FormationId;
}

export default function MiniPitch({ squad, label, color, formation = '4-3-3' }: MiniPitchProps) {
  const colorClass = color === 'blue' ? '#3B82F6' : '#EF4444';

  // Get formation layout
  const formationDef = useMemo(() => getFormation(formation), [formation]);
  const slots = formationDef.slots;

  // Map squad by position index (in order of formation slots)
  const squadBySlot: (FootballPlayer | null)[] = useMemo(() => {
    return slots.map((slot, i) => {
      // Find the i-th player that matches the position
      const positionMatches = squad.filter((p) => p.position === slot.position);
      // Count how many of this position appeared before in slots
      const prevCount = slots.slice(0, i).filter((s) => s.position === slot.position).length;
      return positionMatches[prevCount] ?? null;
    });
  }, [squad, slots]);

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-white/10">
      {/* Header */}
      <div
        className="px-3 py-2 text-xs font-bold text-center"
        style={{ backgroundColor: `${colorClass}20`, color: colorClass }}
      >
        {color === 'blue' ? '🔵' : '🔴'} {label} ({squad.length}/11) • {formation}
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
        {slots.map((slot, i) => {
          const player = squadBySlot[i];
          // Map formation coordinates to pitch visual:
          // slot.x 0-100 → visual x 10%-90%
          // slot.y 0-100 (own goal to opponent goal) → visual y 88% to 8% (flip for display, top=attack)
          const xPct = 10 + (slot.x / 100) * 80;
          const yPct = 88 - (slot.y / 100) * 80;
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
