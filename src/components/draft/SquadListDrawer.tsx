'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Star } from 'lucide-react';
import { FootballPlayer } from '@/types/game';
import { formatCurrency, getPositionColor } from '@/lib/utils';

interface SquadListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  player1Name: string;
  player2Name: string;
  player1Squad: FootballPlayer[];
  player2Squad: FootballPlayer[];
  player1Budget: number;
  player2Budget: number;
}

export default function SquadListDrawer({
  isOpen,
  onClose,
  player1Name,
  player2Name,
  player1Squad,
  player2Squad,
  player1Budget,
  player2Budget,
}: SquadListDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-hidden rounded-t-3xl bg-slate-900 ring-1 ring-white/10"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-emerald-400" />
                <span className="font-bold text-white">Daftar Skuad</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Squad content */}
            <div className="grid grid-cols-2 gap-0 overflow-y-auto max-h-[calc(80vh-80px)]">
              <SquadColumn
                name={player1Name}
                squad={player1Squad}
                budget={player1Budget}
                color="blue"
              />
              <SquadColumn
                name={player2Name}
                squad={player2Squad}
                budget={player2Budget}
                color="red"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SquadColumn({
  name,
  squad,
  budget,
  color,
}: {
  name: string;
  squad: FootballPlayer[];
  budget: number;
  color: 'blue' | 'red';
}) {
  const colorClass = color === 'blue' ? 'text-blue-400' : 'text-red-400';
  const bgClass = color === 'blue' ? 'bg-blue-500/10' : 'bg-red-500/10';
  const borderClass = color === 'blue' ? 'border-r border-white/10' : '';
  const totalSpent = squad.reduce((s, p) => s + p.price, 0);

  return (
    <div className={`${borderClass} p-3`}>
      {/* Column header */}
      <div className={`rounded-xl ${bgClass} px-3 py-2 mb-3`}>
        <p className={`text-xs font-bold ${colorClass}`}>
          {color === 'blue' ? '🔵' : '🔴'} {name}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Sisa: <span className="font-mono font-semibold text-amber-400">{formatCurrency(budget)}</span>
        </p>
      </div>

      {/* Player list */}
      <div className="space-y-1.5">
        {squad.length === 0 ? (
          <p className="text-center text-xs text-slate-600 py-4">Belum ada pemain</p>
        ) : (
          squad.map((player) => {
            const posColor = getPositionColor(player.position);
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: color === 'blue' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-2 py-1.5"
              >
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ backgroundColor: `${posColor}20`, color: posColor }}
                >
                  {player.position}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{player.name}</p>
                  <p className="text-[10px] text-slate-500">{player.club}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star size={9} className="text-amber-400" fill="#F59E0B" />
                  <span className="font-mono text-[10px] text-amber-400">{player.rating}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
