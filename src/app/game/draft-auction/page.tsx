'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, RotateCcw, Trophy, AlertTriangle, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDraftAuctionStore } from '@/stores/useDraftAuctionStore';
import BudgetSetupModal from '@/components/draft/BudgetSetupModal';
import DraftAuctionArena from '@/components/draft/DraftAuctionArena';
import OSMMatchSimulation from '@/components/draft/OSMMatchSimulation';
import MiniPitch from '@/components/draft/MiniPitch';
import SquadListDrawer from '@/components/draft/SquadListDrawer';
import Button from '@/components/common/Button';
import { DraftAuctionState, DraftPair } from '@/types/game';
import { formatCurrency } from '@/lib/utils';

export default function DraftAuctionPage() {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const game = useDraftAuctionStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (game.gameStatus === 'completed' || game.gameStatus === 'simulation') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#ffffff'],
      });
    }
  }, [game.gameStatus]);

  if (!mounted) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-slate-500 text-sm"
        >
          Loading pitch...
        </motion.div>
      </div>
    );
  }

  if (game.gameStatus === 'setup') {
    return (
      <BudgetSetupModal
        onStart={(p1Name, p2Name, budget, pairs: DraftPair[]) => {
          game.initializeDraft(p1Name, p2Name, budget, pairs);
        }}
      />
    );
  }

  if (game.gameStatus === 'simulation') {
    return (
      <div className="min-h-[calc(100vh-64px)] py-6">
        <OSMMatchSimulation
          player1={game.player1}
          player2={game.player2}
          onResetDraft={game.resetDraft}
        />
      </div>
    );
  }

  if (game.gameStatus === 'completed') {
    return <DraftCompletedScreen game={game} />;
  }

  const currentPair = game.draftPairs[game.currentRoundIndex];

  return (
    <div className="min-h-[calc(100vh-64px)] pb-24">
      {/* Draft header bar */}
      <div className="sticky top-16 z-10 border-b border-white/5 bg-slate-950/90 backdrop-blur px-4 py-2">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <span className="text-xs text-slate-400 font-semibold truncate">
            ⚽ 1v1 Draft Auction • Ronde {game.currentRoundIndex + 1}/{game.draftPairs.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <RotateCcw size={14} />
              Reset Game
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(true)}>
              <LayoutList size={14} />
              Lihat Skuad
            </Button>
          </div>
        </div>
      </div>

      {/* Main draft auction arena */}
      <div className="py-6">
        <AnimatePresence mode="wait">
          {currentPair && (
            <motion.div
              key={game.currentRoundIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DraftAuctionArena
                pair={currentPair}
                roundIndex={game.currentRoundIndex}
                totalRounds={game.draftPairs.length}
                player1Name={game.player1.name}
                player2Name={game.player2.name}
                player1Budget={game.player1.budgetRemaining}
                player2Budget={game.player2.budgetRemaining}
                currentTurn={game.currentTurn}
                currentHighestBid={game.currentHighestBid}
                currentHighestBidder={game.currentHighestBidder}
                bidHistory={game.bidHistory}
                lastRoundWinnerMessage={game.lastRoundWinnerMessage}
                onPlaceBid={game.placeBid}
                onSurrender={game.surrenderAuction}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini pitches */}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-4 px-4">
          <MiniPitch
            squad={game.player1.squad}
            label={game.player1.name}
            color="blue"
          />
          <MiniPitch
            squad={game.player2.squad}
            label={game.player2.name}
            color="red"
          />
        </div>
      </div>

      {/* Squad Drawer */}
      <SquadListDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        player1Name={game.player1.name}
        player2Name={game.player2.name}
        player1Squad={game.player1.squad}
        player2Squad={game.player2.squad}
        player1Budget={game.player1.budgetRemaining}
        player2Budget={game.player2.budgetRemaining}
      />

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 ring-1 ring-red-500/30">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Draft Game?</h3>
                  <p className="text-xs text-slate-400">
                    Semua progres ronde dan skuad saat ini akan dihapus dan kembali ke menu awal.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowResetConfirm(false);
                    game.resetDraft();
                  }}
                >
                  <RotateCcw size={14} />
                  Ya, Reset Game
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DraftCompletedScreen({ game }: { game: DraftAuctionState }) {
  const isBankrupt = game.bankruptPlayer !== null;
  const bankruptName = game.bankruptPlayer === 'player1' ? game.player1.name : game.player2.name;
  const winnerName = game.bankruptPlayer === 'player1' ? game.player2.name : game.player1.name;

  const p1Avg =
    game.player1.squad.length > 0
      ? Math.round(game.player1.squad.reduce((s, p) => s + p.rating, 0) / game.player1.squad.length)
      : 0;
  const p2Avg =
    game.player2.squad.length > 0
      ? Math.round(game.player2.squad.reduce((s, p) => s + p.rating, 0) / game.player2.squad.length)
      : 0;
  const ratingWinner = p1Avg > p2Avg ? game.player1.name : p1Avg < p2Avg ? game.player2.name : 'Seri';

  const finalWinner = isBankrupt ? winnerName : ratingWinner;

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Winner banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-2xl p-6 text-center ring-1 ${
            isBankrupt
              ? 'bg-red-500/10 ring-red-500/30'
              : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 ring-emerald-500/30'
          }`}
        >
          <Trophy size={40} className="mx-auto mb-3 text-amber-400" />
          <p className="text-sm text-slate-400 mb-1">
            {isBankrupt ? '💥 GAME OVER - BANKRUT!' : 'Draft Selesai!'}
          </p>
          <h2 className="text-2xl font-bold text-white">
            {finalWinner === 'Seri' ? '🤝 Seri!' : `🏆 ${finalWinner} Menang!`}
          </h2>
          <p className="mt-1.5 text-sm text-slate-300">
            {isBankrupt
              ? `${bankruptName} kehabisan budget sebelum skuad 11 pemain lengkap! ${winnerName} menang otomatis.`
              : 'Berdasarkan rata-rata rating skuad'}
          </p>
        </motion.div>

        {/* Score comparison */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {[
            {
              name: game.player1.name,
              avg: p1Avg,
              squad: game.player1.squad,
              budget: game.player1.budgetRemaining,
              color: 'blue' as const,
              isBankrupt: game.bankruptPlayer === 'player1',
            },
            {
              name: game.player2.name,
              avg: p2Avg,
              squad: game.player2.squad,
              budget: game.player2.budgetRemaining,
              color: 'red' as const,
              isBankrupt: game.bankruptPlayer === 'player2',
            },
          ].map((p) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl bg-slate-900 p-4 ring-1 ${
                p.isBankrupt
                  ? 'ring-red-500/50 bg-red-500/5'
                  : p.color === 'blue'
                  ? 'ring-blue-500/20'
                  : 'ring-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-bold ${p.color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                  {p.color === 'blue' ? '🔵' : '🔴'} {p.name}
                </p>
                {p.isBankrupt && (
                  <span className="text-[10px] font-extrabold text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                    BANKRUT
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Rata-rata Rating</span>
                  <span className="font-mono font-bold text-amber-400">⭐ {p.avg}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Sisa Budget</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(p.budget)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Pemain Skuad</span>
                  <span className="font-mono font-bold text-white">{p.squad.length}/11</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mini pitches */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MiniPitch squad={game.player1.squad} label={game.player1.name} color="blue" />
          <MiniPitch squad={game.player2.squad} label={game.player2.name} color="red" />
        </div>

        <div className="space-y-2">
          {!isBankrupt && game.player1.squad.length === 11 && game.player2.squad.length === 11 && (
            <Button
              fullWidth
              size="lg"
              variant="primary"
              onClick={game.startMatchSimulation}
            >
              <Play size={16} />
              Mainkan Simulasi Match OSM
            </Button>
          )}

          <Button fullWidth size="lg" variant="secondary" onClick={game.resetDraft}>
            <RotateCcw size={16} />
            Draft Ulang / Reset Game
          </Button>
        </div>
      </div>
    </div>
  );
}
