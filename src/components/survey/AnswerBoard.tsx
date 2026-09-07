'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw, Trophy, CheckCircle2, X, Clock, ArrowLeftRight, Star, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import FlipCard from './FlipCard';
import Button from '@/components/common/Button';
import { FamilySurveyState } from '@/types/game';

const TURN_DURATION = 30;

interface AnswerBoardProps {
  game: FamilySurveyState;
}

export default function AnswerBoard({ game }: AnswerBoardProps) {
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'timeout';
    message: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const is1Player = game.mode === '1player';
  const isCompleted = game.gameStatus === 'completed';
  const allRevealed = game.answers.every((a) => a.isRevealed);
  const isWin = isCompleted && allRevealed;
  const isLost = isCompleted && !allRevealed;
  const currentPlayer = game.players[game.currentPlayerIndex];
  const otherPlayer = game.players[game.currentPlayerIndex === 0 ? 1 : 0];

  // ── Timer ──────────────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isCompleted) { clearTimer(); return; }
    setTimeLeft(TURN_DURATION);
    clearTimer();
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentPlayerIndex, game.totalScore, isCompleted]);

  // Handle timer expiry
  useEffect(() => {
    if (timeLeft <= 0 && !isCompleted) {
      clearTimer();
      setGuess('');
      const nextName = is1Player ? currentPlayer.name : otherPlayer.name;
      setFeedback({
        type: 'timeout',
        message: is1Player
          ? `⏰ Waktu habis! -1 nyawa`
          : `⏰ Waktu habis! Giliran berganti ke ${nextName}`,
      });
      setIsSwitching(true);
      setTimeout(() => {
        game.timeOut();
        setFeedback(null);
        setIsSwitching(false);
        inputRef.current?.focus();
      }, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isCompleted]);

  // Win confetti
  useEffect(() => {
    if (isWin) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#10B981', '#F59E0B', '#ffffff'] });
    }
  }, [isWin]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!guess.trim() || isCompleted || isSwitching) return;

    const result = game.submitGuess(guess.trim());
    setGuess('');

    if (result.matched) {
      setFeedback({ type: 'success', message: `+${result.points} poin! Betul! 🎉` });
      setTimeout(() => { setFeedback(null); inputRef.current?.focus(); }, 1200);
    } else {
      const nextName = is1Player ? undefined : otherPlayer.name;
      setFeedback({
        type: 'error',
        message: is1Player
          ? `Salah! -1 nyawa`
          : `Salah! Giliran berganti ke ${nextName}`,
      });
      setIsSwitching(!is1Player);
      setTimeout(() => {
        setFeedback(null);
        setIsSwitching(false);
        inputRef.current?.focus();
      }, 1500);
    }
  };

  // Timer bar color
  const timerPct = (timeLeft / TURN_DURATION) * 100;
  const timerColor = timeLeft > 15 ? '#10B981' : timeLeft > 8 ? '#F59E0B' : '#EF4444';

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-8">
      {/* ── Top Bar with Reset Button ───────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <span>🏆 Family 100</span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-400 font-mono">
            {is1Player ? 'Solo' : '2-Player'}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowResetConfirm(true)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <RotateCcw size={14} />
          Reset Game
        </Button>
      </div>

      {/* ── Player Header ────────────────────────────────────────────── */}
      <motion.div
        className={`mb-4 ${is1Player ? '' : 'grid grid-cols-2 gap-2'}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {is1Player ? (
          /* ── 1-Player Card ── */
          <div className="rounded-2xl bg-emerald-500/15 p-4 ring-1 ring-emerald-500/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-300 mb-1">
                  ⚽ {currentPlayer.name || 'Solo Player'}
                </p>
                <div className="flex items-center gap-3">
                  {/* Individual score */}
                  <div className="flex items-center gap-1">
                    <Trophy size={13} className="text-amber-400" />
                    <span className="font-mono text-lg font-bold text-amber-400">{currentPlayer.score}</span>
                    <span className="text-xs text-slate-500">poin</span>
                  </div>
                </div>
              </div>
              {/* Strikes */}
              <div className="flex gap-1">
                {Array.from({ length: game.maxStrikes }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={i < currentPlayer.strikes ? { scale: [1, 1.4, 1] } : {}}
                    className={`h-7 w-7 rounded-lg text-xs flex items-center justify-center font-bold transition-all ${
                      i < currentPlayer.strikes
                        ? 'bg-red-500/30 text-red-400'
                        : 'bg-slate-700 text-slate-600'
                    }`}
                  >
                    {i < currentPlayer.strikes ? '✗' : '○'}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── 2-Player Cards ── */
          game.players.map((player, idx) => {
            const isActive = game.currentPlayerIndex === idx && !isCompleted;
            const isBlue = idx === 0;
            return (
              <motion.div
                key={idx}
                animate={isActive ? { scale: 1 } : { scale: 0.97 }}
                className={`rounded-2xl p-3 ring-1 transition-all ${
                  isActive
                    ? isBlue
                      ? 'bg-blue-500/15 ring-blue-500/40'
                      : 'bg-red-500/15 ring-red-500/40'
                    : 'bg-slate-800/40 ring-white/5'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${
                      isActive ? (isBlue ? 'text-blue-300' : 'text-red-300') : 'text-slate-500'
                    }`}>
                      {isBlue ? '🔵' : '🔴'} {player.name || `Pemain ${idx + 1}`}
                    </p>
                    {/* Individual score */}
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={10} className="text-amber-400" fill="#F59E0B" />
                      <span className="font-mono text-sm font-bold text-amber-400">{player.score}</span>
                      <span className="text-[10px] text-slate-600">poin</span>
                    </div>
                  </div>
                  {isActive && !isCompleted && (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-[10px] font-semibold text-emerald-400 shrink-0 ml-1"
                    >
                      GILIRAN
                    </motion.span>
                  )}
                </div>
                {/* Strikes */}
                <div className="flex gap-1">
                  {Array.from({ length: game.maxStrikes }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={i < player.strikes ? { scale: [1, 1.4, 1] } : {}}
                      className={`h-5 w-5 rounded-md text-[10px] flex items-center justify-center font-bold transition-all ${
                        i < player.strikes
                          ? 'bg-red-500/30 text-red-400'
                          : 'bg-slate-700 text-slate-600'
                      }`}
                    >
                      {i < player.strikes ? '✗' : '○'}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* ── Timer Bar ───────────────────────────────────────────────── */}
      {!isCompleted && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Clock size={12} style={{ color: timerColor }} />
              <span className="text-xs text-slate-500">Waktu</span>
            </div>
            <motion.span
              key={timeLeft}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-mono text-sm font-bold"
              style={{ color: timerColor }}
            >
              {timeLeft}s
            </motion.span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-colors duration-500"
              animate={{ width: `${timerPct}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
              style={{ backgroundColor: timerColor }}
            />
          </div>
        </div>
      )}

      {/* ── Total Score & Progress ──────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <span className="font-mono text-2xl font-bold text-amber-400">{game.totalScore}</span>
          <span className="text-xs text-slate-500">total</span>
        </div>
        <span className="text-xs text-slate-500">
          {game.answers.filter((a) => a.isRevealed).length}/{game.answers.length} terjawab
        </span>
      </div>

      {/* ── Question ────────────────────────────────────────────────── */}
      <div className="mb-4 rounded-2xl bg-slate-800/60 p-4 text-center ring-1 ring-white/10 backdrop-blur">
        <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-400 mb-1.5">Pertanyaan</p>
        <h2 className="text-base font-bold text-white leading-snug">{game.question}</h2>
      </div>

      {/* ── Answer Cards ────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {game.answers.map((answer, index) => (
          <motion.div
            key={answer.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <FlipCard
              answer={answer}
              index={index}
              isRevealed={answer.isRevealed}
              gameOver={isLost}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Feedback Toast ───────────────────────────────────────────── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                : feedback.type === 'timeout'
                  ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
                  : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : feedback.type === 'timeout' ? (
              <Clock size={16} />
            ) : (
              <ArrowLeftRight size={16} />
            )}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input / Game Over ────────────────────────────────────────── */}
      {!isCompleted ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={isSwitching}
            placeholder={
              isSwitching
                ? 'Mengganti giliran...'
                : `${currentPlayer.name || 'Pemain'}, tebak jawabannya...`
            }
            autoFocus
            className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-emerald-500/50 transition-all disabled:opacity-50"
          />
          <Button type="submit" disabled={!guess.trim() || isSwitching}>
            <Send size={16} />
          </Button>
        </form>
      ) : (
        <GameOverScreen isWin={isWin} game={game} />
      )}

      {/* ── Reset Confirmation Modal ─────────────────────────────────── */}
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
                  <h3 className="text-base font-bold text-white">Reset Game Family 100?</h3>
                  <p className="text-xs text-slate-400">
                    Progres game dan skor saat ini akan direset dan kembali ke menu setup pertanyaan.
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
                    game.resetGame();
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

// ─── Game Over Screen ──────────────────────────────────────────────────────────
function GameOverScreen({ isWin, game }: { isWin: boolean; game: FamilySurveyState }) {
  const is1Player = game.mode === '1player';

  // 2-player winner: who got more points
  const winnerIdx =
    !is1Player && game.players[0].score > game.players[1].score
      ? 0
      : !is1Player && game.players[1].score > game.players[0].score
        ? 1
        : -1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-3"
    >
      {/* Result banner */}
      <div
        className={`rounded-2xl p-5 text-center ${
          isWin
            ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
            : 'bg-red-500/10 ring-1 ring-red-500/20'
        }`}
      >
        <div className="text-4xl mb-2">{isWin ? '🏆' : '😔'}</div>
        <p className="text-xl font-bold text-white">
          {isWin ? 'Luar Biasa!' : 'Game Over!'}
        </p>
        {!is1Player && isWin && winnerIdx >= 0 && (
          <p className="text-sm text-emerald-400 mt-1">
            {game.players[winnerIdx as 0 | 1].name} kontributor terbanyak! 🌟
          </p>
        )}
        {!is1Player && isWin && winnerIdx === -1 && (
          <p className="text-sm text-emerald-400 mt-1">Kontribusi seimbang! 🤝</p>
        )}
        <p className="text-sm text-slate-400 mt-2">
          Skor akhir:{' '}
          <span className="font-mono font-bold text-amber-400">{game.totalScore}</span> poin
        </p>
      </div>

      {/* Per-player summary */}
      <div className={`grid gap-2 ${is1Player ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {(is1Player ? [game.players[0]] : game.players).map((p, i) => {
          const isBlue = i === 0;
          return (
            <div
              key={i}
              className={`rounded-xl p-3 ring-1 ${
                is1Player
                  ? 'bg-emerald-500/10 ring-emerald-500/20'
                  : isBlue
                    ? 'bg-blue-500/10 ring-blue-500/20'
                    : 'bg-red-500/10 ring-red-500/20'
              }`}
            >
              <p className={`text-xs font-bold mb-2 ${
                is1Player ? 'text-emerald-400' : isBlue ? 'text-blue-400' : 'text-red-400'
              }`}>
                {is1Player ? '⚽' : isBlue ? '🔵' : '🔴'} {p.name || `Pemain ${i + 1}`}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Poin dijawab</span>
                  <span className="font-mono font-bold text-amber-400">{p.score}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Salah</span>
                  <span className="font-mono font-bold text-white">{p.strikes}/{game.maxStrikes}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button fullWidth variant="secondary" size="lg" onClick={game.resetGame}>
        <RotateCcw size={16} />
        Main Lagi / Reset Game
      </Button>
    </motion.div>
  );
}
