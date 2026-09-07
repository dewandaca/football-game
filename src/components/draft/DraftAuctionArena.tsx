'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Coins, Flame, Flag, AlertCircle, ArrowUpRight, History } from 'lucide-react';
import { DraftPair, BidLogEntry } from '@/types/game';
import { formatCurrency, getPositionColor } from '@/lib/utils';
import Button from '@/components/common/Button';

interface DraftAuctionArenaProps {
  pair: DraftPair;
  roundIndex: number;
  totalRounds: number;
  player1Name: string;
  player2Name: string;
  player1Budget: number;
  player2Budget: number;
  currentTurn: 'player1' | 'player2';
  currentHighestBid: number;
  currentHighestBidder: 'player1' | 'player2' | null;
  bidHistory: BidLogEntry[];
  lastRoundWinnerMessage: string | null;
  onPlaceBid: (playerKey: 'player1' | 'player2', amount: number) => boolean;
  onSurrender: (playerKey: 'player1' | 'player2') => void;
}

export default function DraftAuctionArena({
  pair,
  roundIndex,
  totalRounds,
  player1Name,
  player2Name,
  player1Budget,
  player2Budget,
  currentTurn,
  currentHighestBid,
  currentHighestBidder,
  bidHistory,
  lastRoundWinnerMessage,
  onPlaceBid,
  onSurrender,
}: DraftAuctionArenaProps) {
  const isPlayer1Turn = currentTurn === 'player1';
  const activePlayerName = isPlayer1Turn ? player1Name : player2Name;
  const activePlayerBudget = isPlayer1Turn ? player1Budget : player2Budget;
  const posColor = getPositionColor(pair.position);

  // Target card is playerA, alternative card is playerB
  const targetCard = pair.playerA;
  const altCard = pair.playerB;

  // Minimum required bid:
  // If no one bid yet, minimum is targetCard.price
  // If someone already bid, minimum is currentHighestBid + 1
  const minRequiredBid =
    currentHighestBidder === null ? targetCard.price : currentHighestBid + 1;

  const [bidInput, setBidInput] = useState<number>(minRequiredBid);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Auto-update input when turn or current highest bid changes
  useEffect(() => {
    const nextMin = currentHighestBidder === null ? targetCard.price : currentHighestBid + 1;
    setBidInput(nextMin);
    setErrorMsg('');
  }, [currentHighestBid, currentHighestBidder, targetCard.price, currentTurn]);

  const handleQuickAdd = (increment: number) => {
    const base = currentHighestBidder === null ? targetCard.price : currentHighestBid;
    const newAmount = base + increment;
    setBidInput(newAmount);
  };

  const handleBidSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (bidInput < minRequiredBid) {
      setErrorMsg(`Tawaran minimal adalah > ${formatCurrency(minRequiredBid - 1)} (Min: ${formatCurrency(minRequiredBid)})`);
      return;
    }

    if (bidInput > activePlayerBudget) {
      setErrorMsg(`Budget ${activePlayerName} tidak cukup (Sisa: ${formatCurrency(activePlayerBudget)})`);
      return;
    }

    const success = onPlaceBid(currentTurn, bidInput);
    if (!success) {
      setErrorMsg('Tawaran tidak valid');
    } else {
      setErrorMsg('');
    }
  };

  const canAffordMinBid = activePlayerBudget >= minRequiredBid;

  return (
    <div className="mx-auto max-w-3xl px-4 space-y-6">
      {/* Toast / Alert for last round result */}
      <AnimatePresence>
        {lastRoundWinnerMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 p-3 text-center ring-1 ring-emerald-500/30 text-xs font-semibold text-emerald-300"
          >
            {lastRoundWinnerMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span
            className="rounded-lg px-3 py-1 text-xs font-extrabold uppercase tracking-wider"
            style={{ backgroundColor: `${posColor}25`, color: posColor }}
          >
            Posisi: {pair.position}
          </span>
          <span className="text-xs font-medium text-slate-400">
            Ronde {roundIndex + 1} dari {totalRounds}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mx-auto h-1.5 w-56 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${((roundIndex + 1) / totalRounds) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Budget Header comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-2xl p-3.5 ring-1 transition-all ${
            isPlayer1Turn
              ? 'bg-blue-500/10 ring-blue-500/50 shadow-lg shadow-blue-500/10'
              : 'bg-slate-900/60 ring-white/5 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              🔵 {player1Name}
              {isPlayer1Turn && (
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300 font-normal animate-pulse">
                  Giliran Tawar
                </span>
              )}
            </span>
            {currentHighestBidder === 'player1' && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                <CrownIcon size={10} /> Penawar Tertinggi
              </span>
            )}
          </div>
          <p className="font-mono text-base font-bold text-white mt-1">
            {formatCurrency(player1Budget)}
          </p>
        </div>

        <div
          className={`rounded-2xl p-3.5 ring-1 transition-all ${
            !isPlayer1Turn
              ? 'bg-red-500/10 ring-red-500/50 shadow-lg shadow-red-500/10'
              : 'bg-slate-900/60 ring-white/5 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              🔴 {player2Name}
              {!isPlayer1Turn && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300 font-normal animate-pulse">
                  Giliran Tawar
                </span>
              )}
            </span>
            {currentHighestBidder === 'player2' && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                <CrownIcon size={10} /> Penawar Tertinggi
              </span>
            )}
          </div>
          <p className="font-mono text-base font-bold text-white mt-1">
            {formatCurrency(player2Budget)}
          </p>
        </div>
      </div>

      {/* Main Auction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Primary Target Card being auctioned (3 cols on md) */}
        <div className="md:col-span-3 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-5 ring-2 ring-emerald-500/40 relative overflow-hidden shadow-2xl">
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/40">
            <Flame size={14} className="text-emerald-400 animate-bounce" />
            SEDANG DILELANG
          </div>

          <div
            className="absolute right-3 top-3 rounded-lg px-2.5 py-1 text-xs font-bold"
            style={{ backgroundColor: `${posColor}30`, color: posColor }}
          >
            {targetCard.position}
          </div>

          <div className="mt-7 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-amber-400 flex items-center gap-1">
                <Star size={20} fill="#F59E0B" className="text-amber-400" />
                {targetCard.rating}
              </span>
              <h2 className="text-xl font-bold text-white leading-snug">{targetCard.name}</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium">{targetCard.club}</p>

            {/* Base Price & Live Current High Bid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div className="rounded-xl bg-slate-950/60 p-2.5">
                <span className="text-[11px] text-slate-400 block font-medium">Harga Awal (Open Price)</span>
                <span className="font-mono text-sm font-bold text-slate-300">
                  {formatCurrency(targetCard.price)}
                </span>
              </div>
              <div className="rounded-xl bg-emerald-950/60 p-2.5 ring-1 ring-emerald-500/30">
                <span className="text-[11px] text-emerald-400 block font-medium">Tawaran Tertinggi</span>
                <span className="font-mono text-base font-extrabold text-emerald-300">
                  {formatCurrency(currentHighestBid)}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Oleh:{' '}
                  {currentHighestBidder === 'player1'
                    ? `🔵 ${player1Name}`
                    : currentHighestBidder === 'player2'
                    ? `🔴 ${player2Name}`
                    : 'Belum ada'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Card preview (2 cols on md) */}
        <div className="md:col-span-2 rounded-2xl bg-slate-900/80 p-4 ring-1 ring-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kartu Cadangan
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                {altCard.position}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="font-mono text-sm font-bold text-amber-400">⭐ {altCard.rating}</span>
              <h3 className="text-sm font-bold text-slate-200">{altCard.name}</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">{altCard.club}</p>
          </div>

          <div className="rounded-xl bg-slate-950 p-2.5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 block">Hak Milik Pemain Yang Nyerah</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Harga Tetap:</span>
              <span className="font-mono text-xs font-bold text-amber-400">
                {formatCurrency(altCard.price)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bidding Control Panel */}
      <div className="rounded-2xl bg-slate-900/90 p-5 ring-1 ring-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isPlayer1Turn ? '🔵' : '🔴'}</span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Giliran Tawar: <span className={isPlayer1Turn ? 'text-blue-400' : 'text-red-400'}>{activePlayerName}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Bebas menawar harga berapapun di atas {formatCurrency(currentHighestBidder === null ? targetCard.price - 1 : currentHighestBid)}
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-slate-400 font-semibold bg-slate-800 px-3 py-1 rounded-lg">
            Sisa Budget: {formatCurrency(activePlayerBudget)}
          </span>
        </div>

        {/* Quick Add Buttons */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tambah Bid Cepat (Bebas)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => handleQuickAdd(inc)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-mono font-bold text-emerald-400 py-2.5 ring-1 ring-white/5 transition-all flex items-center justify-center gap-1"
              >
                <ArrowUpRight size={12} />
                +{inc >= 1000 ? `${inc / 1000}k` : inc}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input & Action buttons */}
        <form onSubmit={handleBidSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">
              Input Nominal Harga Bebas (Rp)
            </label>
            <div className="relative">
              <input
                type="number"
                value={bidInput || ''}
                onChange={(e) => setBidInput(Number(e.target.value))}
                min={minRequiredBid}
                max={activePlayerBudget}
                step={1}
                className="w-full rounded-xl bg-slate-950 px-4 py-3 font-mono text-base font-bold text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50"
                placeholder={`Bebas input (Min: ${minRequiredBid})`}
              />
              <div className="absolute right-3 top-3 text-xs text-slate-500 font-mono">
                Min: {formatCurrency(minRequiredBid)}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl ring-1 ring-red-500/20">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Button
              type="submit"
              size="lg"
              variant="primary"
              disabled={!canAffordMinBid}
              fullWidth
            >
              <Coins size={16} />
              Tawar Harga ({formatCurrency(bidInput)})
            </Button>

            <Button
              type="button"
              size="lg"
              variant="danger"
              fullWidth
              onClick={() => onSurrender(currentTurn)}
            >
              <Flag size={16} />
              Nyerah (Pas)
            </Button>
          </div>
        </form>

        <p className="text-[11px] text-slate-500 text-center">
          💡 Tips: Kamu bebas memasukkan nominal angka berapa saja yang penting di atas harga tertinggi. Hati-hati jangan sampai kehabisan uang sebelum 11 pemain lengkap!
        </p>
      </div>

      {/* Live Auction History Log */}
      {bidHistory.length > 0 && (
        <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <History size={14} /> Riwayat Penawaran Ronde Ini
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {bidHistory.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span>{log.playerKey === 'player1' ? '🔵' : '🔴'}</span>
                  <span className="font-semibold text-slate-200">{log.playerName}</span>
                  {log.type === 'bid' ? (
                    <span className="text-emerald-400 font-mono font-bold">
                      Menawar {formatCurrency(log.amount)}
                    </span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <Flag size={10} /> Menyerah!
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CrownIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-amber-400"
    >
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}
