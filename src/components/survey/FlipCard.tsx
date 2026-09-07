'use client';

import { SurveyAnswer } from '@/types/game';
import { motion } from 'framer-motion';

interface FlipCardProps {
  answer: SurveyAnswer;
  index: number;
  isRevealed: boolean;
  /** When true and answer is NOT revealed: show it with a red "missed" style */
  gameOver?: boolean;
}

export default function FlipCard({ answer, index, isRevealed, gameOver }: FlipCardProps) {
  const showBack = isRevealed || (gameOver && !isRevealed);
  const isMissed = gameOver && !isRevealed; // was NOT guessed by players

  return (
    <div className="relative h-20" style={{ perspective: '1000px' }}>
      <motion.div
        initial={false}
        animate={{ rotateY: showBack ? 180 : 0 }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
          // Stagger the missed reveals on game over
          delay: isMissed ? index * 0.08 : 0,
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-full w-full"
      >
        {/* Front: Hidden card */}
        <div
          className="absolute inset-0 flex items-center justify-between rounded-xl bg-slate-800 px-4 ring-1 ring-white/10"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-xs font-bold text-slate-400 font-mono">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-2 w-2 rounded-full bg-slate-700" />
              ))}
            </div>
          </div>
          <span className="font-mono text-lg font-bold text-slate-600">?</span>
        </div>

        {/* Back: Revealed answer */}
        <div
          className="absolute inset-0 flex items-center justify-between rounded-xl px-4 ring-1"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: isMissed
              ? 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)'
              : 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
            borderColor: isMissed ? '#EF4444' : '#10B981',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold font-mono"
              style={{
                backgroundColor: isMissed ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                color: isMissed ? '#EF4444' : '#34D399',
              }}
            >
              {isMissed ? '✗' : String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-sm font-semibold text-white leading-tight">
              {answer.answer}
            </span>
          </div>
          <div
            className="flex h-9 min-w-[2.5rem] items-center justify-center rounded-lg px-2 shadow-lg"
            style={{
              backgroundColor: isMissed ? '#EF4444' : '#10B981',
              boxShadow: isMissed ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(16,185,129,0.3)',
            }}
          >
            <span className="font-mono text-sm font-bold text-white">
              {answer.points}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
