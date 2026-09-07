'use client';

import { motion } from 'framer-motion';
import { Star, Coins, CheckCircle2 } from 'lucide-react';
import { DraftPair, FootballPlayer } from '@/types/game';
import { formatCurrency, getPositionColor } from '@/lib/utils';
import Button from '@/components/common/Button';

interface DraftCardPairProps {
  pair: DraftPair;
  currentTurn: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  player1Budget: number;
  player2Budget: number;
  onChoose: (playerId: string) => void;
  roundIndex: number;
  totalRounds: number;
}

export default function DraftCardPair({
  pair,
  currentTurn,
  player1Name,
  player2Name,
  player1Budget,
  player2Budget,
  onChoose,
  roundIndex,
  totalRounds,
}: DraftCardPairProps) {
  const isPlayer1Turn = currentTurn === 'player1';
  const currentPlayerName = isPlayer1Turn ? player1Name : player2Name;
  const currentBudget = isPlayer1Turn ? player1Budget : player2Budget;
  const posColor = getPositionColor(pair.position);

  return (
    <div className="mx-auto max-w-2xl px-4">
      {/* Round info */}
      <motion.div
        key={roundIndex}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 text-center"
      >
        <div className="mb-2 flex items-center justify-center gap-2">
          <span
            className="rounded-lg px-3 py-1 text-xs font-bold tracking-wider"
            style={{ backgroundColor: `${posColor}20`, color: posColor }}
          >
            {pair.position}
          </span>
          <span className="text-xs text-slate-500">
            Ronde {roundIndex + 1} / {totalRounds}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mx-auto mb-3 h-1.5 w-48 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${((roundIndex) / totalRounds) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Current turn */}
        <div
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ring-1 ${
            isPlayer1Turn
              ? 'bg-blue-500/20 text-blue-400 ring-blue-500/30'
              : 'bg-red-500/20 text-red-400 ring-red-500/30'
          }`}
        >
          <span>{isPlayer1Turn ? '🔵' : '🔴'}</span>
          Giliran {currentPlayerName}
          <span className="font-mono text-xs opacity-70">
            💰 {formatCurrency(currentBudget)}
          </span>
        </div>
      </motion.div>

      {/* Player cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[pair.playerA, pair.playerB].map((player, i) => (
          <PlayerCard
            key={player.id}
            player={player}
            posColor={posColor}
            canAfford={currentBudget >= player.price}
            onChoose={() => onChoose(player.id)}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* Budget comparison */}
      <div className="grid grid-cols-2 gap-3">
        <BudgetBar name={player1Name} budget={player1Budget} isActive={isPlayer1Turn} color="blue" />
        <BudgetBar name={player2Name} budget={player2Budget} isActive={!isPlayer1Turn} color="red" />
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  posColor,
  canAfford,
  onChoose,
  delay,
}: {
  player: FootballPlayer;
  posColor: string;
  canAfford: boolean;
  onChoose: () => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={canAfford ? { y: -4, scale: 1.02 } : {}}
      className={`relative overflow-hidden rounded-2xl bg-slate-800 ring-1 transition-all ${
        canAfford
          ? 'ring-white/10 hover:ring-emerald-500/40 cursor-pointer'
          : 'ring-red-500/20 opacity-60'
      }`}
      onClick={canAfford ? onChoose : undefined}
    >
      {/* Position badge */}
      <div
        className="absolute right-3 top-3 rounded-lg px-2 py-0.5 text-xs font-bold"
        style={{ backgroundColor: `${posColor}25`, color: posColor }}
      >
        {player.position}
      </div>

      {/* Rating arc background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at 30% 0%, ${posColor}, transparent 60%)`,
        }}
      />

      <div className="p-4">
        {/* Rating */}
        <div className="mb-3 flex items-center gap-1">
          <Star size={12} className="text-amber-400" fill="#F59E0B" />
          <span className="font-mono text-sm font-bold text-amber-400">{player.rating}</span>
        </div>

        {/* Player name */}
        <h3 className="mb-0.5 text-sm font-bold text-white leading-tight line-clamp-2">
          {player.name}
        </h3>
        <p className="text-xs text-slate-500">{player.club}</p>

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400">
            <Coins size={12} />
            <span className="font-mono text-xs font-bold">{formatCurrency(player.price)}</span>
          </div>
          {!canAfford && (
            <span className="text-xs text-red-400 font-medium">Kurang!</span>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      {canAfford && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/0 opacity-0 hover:bg-emerald-500/10 hover:opacity-100 transition-all rounded-2xl">
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg">
            <CheckCircle2 size={14} />
            Pilih
          </div>
        </div>
      )}
    </motion.div>
  );
}

function BudgetBar({
  name,
  budget,
  isActive,
  color,
}: {
  name: string;
  budget: number;
  isActive: boolean;
  color: 'blue' | 'red';
}) {
  const colorClasses = {
    blue: { text: 'text-blue-400', bg: 'bg-blue-500', ring: 'ring-blue-500/30', active: 'bg-blue-500/10' },
    red: { text: 'text-red-400', bg: 'bg-red-500', ring: 'ring-red-500/30', active: 'bg-red-500/10' },
  }[color];

  return (
    <div
      className={`rounded-xl p-3 ring-1 transition-all ${
        isActive ? `${colorClasses.active} ${colorClasses.ring}` : 'bg-slate-800/40 ring-white/5'
      }`}
    >
      <p className={`text-xs font-medium ${isActive ? colorClasses.text : 'text-slate-500'}`}>
        {color === 'blue' ? '🔵' : '🔴'} {name}
      </p>
      <p className="font-mono text-sm font-bold text-white mt-0.5">
        {formatCurrency(budget)}
      </p>
    </div>
  );
}
