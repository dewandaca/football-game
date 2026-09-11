'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, FastForward, SkipForward, RotateCcw,
  Zap, ChevronRight, BarChart3, Activity, Target, Shield,
  Award, Flame, Trophy
} from 'lucide-react';
import Button from '@/components/common/Button';
import MatchResultScreen from './MatchResultScreen';
import {
  MatchResult,
  MatchEvent,
  FootballPlayer,
  PlayerSlotAssignment,
} from '@/types/game';
import { ANIMATION_TIMING } from '@/lib/matchConfig';

// =====================================================
// MAIN MATCH LIVE COMPONENT (DASHBOARD MATCH CENTER)
// =====================================================

interface MatchLiveProps {
  matchResult: MatchResult;
  homeSquad: FootballPlayer[];
  awaySquad: FootballPlayer[];
  homeAssignments: PlayerSlotAssignment[];
  awayAssignments: PlayerSlotAssignment[];
  initialFinished?: boolean;
  onReplay: () => void;
  onBackToSetup?: () => void;
  onNewDraft?: () => void;
}

export default function MatchLive({
  matchResult, homeSquad, awaySquad,
  initialFinished = false,
  onReplay, onBackToSetup, onNewDraft,
}: MatchLiveProps) {
  const events = matchResult.events;
  const [currentEventIndex, setCurrentEventIndex] = useState(
    initialFinished ? Math.max(0, events.length - 1) : 0
  );
  const [isPlaying, setIsPlaying] = useState(!initialFinished);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const [isFinished, setIsFinished] = useState(initialFinished);
  const commentaryRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smooth scroll down to match results when match finishes
  useEffect(() => {
    if (isFinished && !initialFinished) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFinished, initialFinished]);

  const currentEvent = events[currentEventIndex] || events[events.length - 1];

  // Get animation duration for current event
  const getEventDuration = useCallback((event: MatchEvent): number => {
    const timing = ANIMATION_TIMING;
    const baseMs = (() => {
      switch (event.type) {
        case 'goal': return timing.goal;
        case 'penaltyKick': return 2200;
        case 'save': return timing.save;
        case 'attack':
        case 'dangerousAttack': return timing.attack;
        case 'counterAttack': return timing.counterAttack;
        case 'shotOnTarget':
        case 'shotOffTarget':
        case 'blockedShot':
        case 'shot': return timing.shot;
        case 'buildUp': return timing.buildUp;
        case 'halftime':
        case 'fulltime':
        case 'extraTimeHalftime':
        case 'extraTimeFulltime':
        case 'penaltyShootoutStart':
        case 'secondHalfStart': return timing.break;
        case 'kickoff': return timing.kickoff;
        default: return timing.other;
      }
    })();
    return Math.max(300, baseMs / speed);
  }, [speed]);

  // Auto-advance events
  useEffect(() => {
    if (!isPlaying || isFinished) return;

    const duration = getEventDuration(currentEvent);
    timerRef.current = setTimeout(() => {
      if (currentEventIndex < events.length - 1) {
        setCurrentEventIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
        setIsPlaying(false);
      }
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentEventIndex, isPlaying, isFinished, speed, events.length, currentEvent, getEventDuration]);

  // Auto-scroll commentary to latest event
  useEffect(() => {
    if (commentaryRef.current) {
      const el = commentaryRef.current;
      const timer = setTimeout(() => {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth',
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentEventIndex]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleSkipEvent = () => {
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      setIsPlaying(false);
    }
  };

  const handleSkipToEnd = () => {
    setCurrentEventIndex(events.length - 1);
    setIsFinished(true);
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setCurrentEventIndex(0);
    setIsFinished(false);
    setIsPlaying(true);
    onReplay();
  };

  // Human-readable match period badge
  const periodLabel = useMemo(() => {
    const ev = currentEvent;
    if (!ev) return 'LIVE';
    if (ev.type === 'penaltyShootoutStart' || ev.type === 'penaltyKick' || ev.period === 'penalties') {
      return 'ADU PENALTI';
    }
    if (ev.period === 'extraTimeFirst') {
      return ev.type === 'extraTimeHalftime' ? 'JEDA EXTRA TIME' : `EXTRA TIME 1 • ${ev.minute}'`;
    }
    if (ev.period === 'extraTimeSecond') {
      return ev.type === 'extraTimeFulltime' ? 'EXTRA TIME SELESAI' : `EXTRA TIME 2 • ${ev.minute}'`;
    }
    if (ev.type === 'halftime') return 'BABAK 1 SELESAI';
    if (ev.type === 'fulltime') return ev.homeScore === ev.awayScore ? '90 MENIT IMBANG' : 'SELESAI';
    if (ev.period === 'secondHalf') return `BABAK 2 • ${ev.minute}'${ev.injuryTime ? '+' : ''}`;
    return `BABAK 1 • ${ev.minute}'${ev.injuryTime ? '+' : ''}`;
  }, [currentEvent]);

  // Real-time cumulative match statistics
  const runningStats = useMemo(() => {
    const visibleEvents = events.slice(0, currentEventIndex + 1);
    let homePoss = 0;
    let awayPoss = 0;
    let homeShots = 0;
    let awayShots = 0;
    let homeSot = 0;
    let awaySot = 0;
    let homeAttacks = 0;
    let awayAttacks = 0;
    let homeCorners = 0;
    let awayCorners = 0;
    let homeSaves = 0;
    let awaySaves = 0;
    let homeFouls = 0;
    let awayFouls = 0;

    for (const ev of visibleEvents) {
      const isHome = ev.team === 'home';
      const isAway = ev.team === 'away';

      if (ev.type === 'possession' || ev.type === 'buildUp') {
        if (isHome) homePoss += 2;
        else if (isAway) awayPoss += 2;
      }
      if (ev.type === 'shot' || ev.type === 'shotOnTarget' || ev.type === 'goal') {
        if (isHome) { homeShots++; homeSot++; }
        else if (isAway) { awayShots++; awaySot++; }
      } else if (ev.type === 'shotOffTarget' || ev.type === 'blockedShot') {
        if (isHome) homeShots++;
        else if (isAway) awayShots++;
      }
      if (ev.type === 'dangerousAttack' || ev.type === 'counterAttack') {
        if (isHome) homeAttacks++;
        else if (isAway) awayAttacks++;
      }
      if (ev.type === 'corner') {
        if (isHome) homeCorners++;
        else if (isAway) awayCorners++;
      }
      if (ev.type === 'save') {
        if (isHome) awaySaves++;
        else if (isAway) homeSaves++;
      }
      if (ev.type === 'foul') {
        if (isHome) homeFouls++;
        else if (isAway) awayFouls++;
      }
    }

    const totalPoss = homePoss + awayPoss;
    const homePossPct = totalPoss > 0 ? Math.round((homePoss / totalPoss) * 100) : 50;
    const awayPossPct = 100 - homePossPct;

    return {
      homePossPct,
      awayPossPct,
      homeShots,
      awayShots,
      homeSot,
      awaySot,
      homeAttacks,
      awayAttacks,
      homeCorners,
      awayCorners,
      homeSaves,
      awaySaves,
      homeFouls,
      awayFouls,
    };
  }, [events, currentEventIndex]);

  // Penalty kicks tracker
  const penaltyKicks = useMemo(() => {
    const kicks = events
      .slice(0, currentEventIndex + 1)
      .filter(e => e.type === 'penaltyKick');
    const homeKicks = kicks.filter(e => e.team === 'home');
    const awayKicks = kicks.filter(e => e.team === 'away');
    return { homeKicks, awayKicks };
  }, [events, currentEventIndex]);

  // Penalty shootout tracker is ONLY visible when the match has actually reached the penalty shootout phase (no spoilers!)
  const isShootoutActive =
    currentEvent.period === 'penalties' ||
    currentEvent.type === 'penaltyShootoutStart' ||
    currentEvent.type === 'penaltyKick' ||
    currentEvent.type === 'penaltyShootoutEnd' ||
    (isFinished && !!matchResult.wentToPenalties);

  // Normalized momentum (-100 to +100) -> width percentage for home and away
  const momentumHomePct = Math.max(15, Math.min(85, 50 + (currentEvent.momentum || 0) * 0.4));
  const momentumAwayPct = 100 - momentumHomePct;

  return (
    <div className="mx-auto max-w-5xl px-4 space-y-4 pb-12">
      {/* SCOREBOARD HERO */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Status / Period Tag */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <motion.span
            key={periodLabel}
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-full px-3.5 py-1 font-mono text-xs font-bold ring-1 transition-all ${
              currentEvent.period === 'penalties'
                ? 'bg-amber-500/20 text-amber-300 ring-amber-500/40 animate-pulse'
                : currentEvent.period?.startsWith('extraTime')
                ? 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/40'
                : 'bg-slate-950/90 text-amber-400 ring-amber-500/30'
            }`}
          >
            {periodLabel} {!isFinished && currentEvent.type !== 'fulltime' && '● LIVE'}
          </motion.span>
        </div>

        {/* Score & Teams Display */}
        <div className="flex items-center justify-between gap-4 text-center">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <span className="text-base sm:text-lg font-black text-blue-400 block truncate">
              🔵 {matchResult.homeTeamName}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Formasi: {matchResult.homeFormation}
            </span>
          </div>

          {/* Center Scores */}
          <div className="flex flex-col items-center gap-1">
            <motion.div
              key={`${currentEvent.homeScore}-${currentEvent.awayScore}`}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center gap-3 font-mono text-3xl sm:text-5xl font-black text-amber-400 bg-slate-950/95 rounded-2xl py-2 px-6 border border-amber-500/40 shadow-2xl"
            >
              <span>{currentEvent.homeScore}</span>
              <span className="text-slate-600 font-sans text-2xl sm:text-3xl">-</span>
              <span>{currentEvent.awayScore}</span>
            </motion.div>

            {/* Penalty Score Subtitle only when Shootout has actually started */}
            {isShootoutActive && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-bold text-amber-300 font-mono bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30"
              >
                Adu Penalti: ({currentEvent.homePenalties ?? 0} - {currentEvent.awayPenalties ?? 0})
              </motion.div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <span className="text-base sm:text-lg font-black text-red-400 block truncate">
              {matchResult.awayTeamName} 🔴
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Formasi: {matchResult.awayFormation}
            </span>
          </div>
        </div>

        {/* Live Momentum Bar */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">
            <span className="text-blue-400 flex items-center gap-1">
              <Flame size={12} /> Dominasi Home
            </span>
            <span className="text-slate-500">Momentum Serangan</span>
            <span className="text-red-400 flex items-center gap-1">
              Dominasi Away <Flame size={12} />
            </span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex ring-1 ring-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              animate={{ width: `${momentumHomePct}%` }}
              transition={{ duration: 0.4 }}
            />
            <motion.div
              className="h-full bg-gradient-to-l from-red-600 to-red-400"
              animate={{ width: `${momentumAwayPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* PLAYBACK CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-2.5 rounded-xl ring-1 ring-white/5">
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={handlePlayPause} disabled={isFinished}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Jeda' : 'Mulai'}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSkipEvent} disabled={isFinished}>
            <SkipForward size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSkipToEnd} disabled={isFinished}>
            <FastForward size={14} />
            Hasil Akhir
          </Button>
          {isFinished && (
            <Button size="sm" variant="primary" onClick={handleReplay}>
              <RotateCcw size={14} />
              Simulasi Ulang
            </Button>
          )}
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 mr-1">Kecepatan:</span>
          {[1, 2, 4].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all ${
                speed === s
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* EVENT SPOTLIGHT BANNER (FOR MAJOR OCCURRENCES) */}
      <AnimatePresence mode="wait">
        {(() => {
          const type = currentEvent.type;
          if (type === 'goal') {
            return (
              <motion.div
                key={currentEvent.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-600/30 via-amber-500/20 to-emerald-600/30 border border-emerald-400/50 shadow-xl flex items-center justify-between gap-3 text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center text-xl animate-bounce">
                    ⚽
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">
                      GOL TERCIPTA! ({currentEvent.minute}&apos;)
                    </span>
                    <h4 className="font-black text-sm sm:text-base text-amber-300">
                      {currentEvent.scorer || 'Pemain'} mencetak gol brilian!
                    </h4>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold bg-slate-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 text-emerald-400">
                  {currentEvent.homeScore} - {currentEvent.awayScore}
                </span>
              </motion.div>
            );
          }

          if (type === 'save') {
            return (
              <motion.div
                key={currentEvent.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="p-3 rounded-xl bg-blue-500/15 border border-blue-400/40 shadow-lg flex items-center gap-3 text-blue-200"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center text-base">
                  🧤
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                    PENYELAMATAN GEMILANG
                  </span>
                  <p className="text-xs font-semibold text-white">
                    Penyelamatan krusial kiper menggagalkan tembakan lawan!
                  </p>
                </div>
              </motion.div>
            );
          }

          if (type === 'penaltyKick') {
            const outcome = currentEvent.penaltyOutcome;
            return (
              <motion.div
                key={currentEvent.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`p-3.5 rounded-xl border shadow-xl flex items-center justify-between gap-3 ${
                  outcome === 'goal'
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                    : 'bg-red-500/20 border-red-400/50 text-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-950 flex items-center justify-center text-lg">
                    {outcome === 'goal' ? '⚽' : outcome === 'save' ? '🧤' : '💨'}
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest block">
                      EKSEKUSI ADU PENALTI
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      {currentEvent.penaltyTaker} : {outcome === 'goal' ? 'GOL! Eksekusi Sempurna!' : outcome === 'save' ? 'DITELEPIS OLEH KIPER!' : 'TENDANGAN MELENCENG!'}
                    </h4>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold bg-slate-950/90 px-3 py-1 rounded-lg border border-white/20">
                  {currentEvent.homePenalties} - {currentEvent.awayPenalties}
                </span>
              </motion.div>
            );
          }

          if (type === 'extraTimeFirstHalfStart' || type === 'penaltyShootoutStart') {
            return (
              <motion.div
                key={currentEvent.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-400/50 shadow-xl flex items-center gap-3 text-amber-200"
              >
                <div className="w-9 h-9 rounded-full bg-amber-500/30 flex items-center justify-center text-lg animate-spin">
                  ⏳
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                    FASE KRUSIAL PERTANDINGAN
                  </span>
                  <h4 className="font-black text-sm text-white">
                    {type === 'extraTimeFirstHalfStart'
                      ? 'Skor Imbang 90 Menit! Babak Tambahan (Extra Time 2x15 Menit) Dimulai!'
                      : 'Skor Masih Imbang! Babak Penentuan Drama Adu Penalti Resmi Dimulai!'}
                  </h4>
                </div>
              </motion.div>
            );
          }

          return null;
        })()}
      </AnimatePresence>

      {/* PENALTY SHOOTOUT PROGRESS TRACKER (VISIBLE ONLY ONCE SHOOTOUT ACTUALLY STARTS) */}
      {isShootoutActive && (
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-xl">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Target size={14} /> Tracking Adu Penalti
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Skor Penalti: {currentEvent.homePenalties ?? 0} - {currentEvent.awayPenalties ?? 0}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Home Kicks */}
            <div className="bg-slate-950/60 p-2 rounded-lg border border-blue-500/20">
              <span className="text-[10px] font-bold text-blue-400 block mb-1 truncate">
                🔵 {matchResult.homeTeamName}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.from({ length: Math.max(5, penaltyKicks.homeKicks.length) }).map((_, idx) => {
                  const kick = penaltyKicks.homeKicks[idx];
                  return (
                    <span
                      key={`home-pen-${idx}`}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        !kick
                          ? 'bg-slate-800 text-slate-500 border border-slate-700'
                          : kick.penaltyOutcome === 'goal'
                          ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50 font-black'
                          : 'bg-red-500 text-white ring-2 ring-red-400/50'
                      }`}
                    >
                      {!kick ? idx + 1 : kick.penaltyOutcome === 'goal' ? '✓' : '✗'}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Away Kicks */}
            <div className="bg-slate-950/60 p-2 rounded-lg border border-red-500/20">
              <span className="text-[10px] font-bold text-red-400 block mb-1 truncate">
                {matchResult.awayTeamName} 🔴
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.from({ length: Math.max(5, penaltyKicks.awayKicks.length) }).map((_, idx) => {
                  const kick = penaltyKicks.awayKicks[idx];
                  return (
                    <span
                      key={`away-pen-${idx}`}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        !kick
                          ? 'bg-slate-800 text-slate-500 border border-slate-700'
                          : kick.penaltyOutcome === 'goal'
                          ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50 font-black'
                          : 'bg-red-500 text-white ring-2 ring-red-400/50'
                      }`}
                    >
                      {!kick ? idx + 1 : kick.penaltyOutcome === 'goal' ? '✓' : '✗'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD BODY: COMMENTARY FEED (LEFT) + LIVE STATS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* LEFT COLUMN: LIVE COMMENTARY FEED (3 cols on lg) */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-900/95 ring-1 ring-white/10 overflow-hidden flex flex-col h-[480px] shadow-2xl">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/80 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Zap size={14} className="text-amber-400 animate-pulse" /> Feed Komentar Langsung
            </h3>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-full ring-1 ring-white/5">
              Event {currentEventIndex + 1} dari {events.length}
            </span>
          </div>

          <div
            ref={commentaryRef}
            className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2 scroll-smooth"
          >
            <AnimatePresence initial={false}>
              {events.slice(0, currentEventIndex + 1).map((ev, i) => {
                const isLatest = i === currentEventIndex;
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${getEventStyle(ev.type)} ${
                      isLatest
                        ? 'ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/10 scale-[1.01]'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <span className="font-mono font-bold text-amber-400 shrink-0 bg-slate-950/90 border border-white/10 px-2 py-0.5 rounded-lg text-[11px] min-w-[34px] text-center mt-0.5">
                      {ev.period === 'penalties' ? 'PEN' : `${ev.minute}'${ev.injuryTime ? '+' : ''}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[11px] sm:text-xs leading-relaxed break-words">
                        {ev.commentary}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE MATCH STATS TRACKER (2 cols on lg) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/95 ring-1 ring-white/10 p-4 shadow-2xl flex flex-col justify-between h-[480px]">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <BarChart3 size={14} /> Statistik Langsung
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
            </div>

            {/* Stat comparison bars */}
            <div className="space-y-2.5">
              <LiveStatRow
                label="Penguasaan Bola"
                v1={`${runningStats.homePossPct}%`}
                v2={`${runningStats.awayPossPct}%`}
                r1={runningStats.homePossPct}
                r2={runningStats.awayPossPct}
              />
              <LiveStatRow
                label="Total Tembakan"
                v1={runningStats.homeShots}
                v2={runningStats.awayShots}
                r1={runningStats.homeShots}
                r2={runningStats.awayShots}
              />
              <LiveStatRow
                label="Tepat Sasaran"
                v1={runningStats.homeSot}
                v2={runningStats.awaySot}
                r1={runningStats.homeSot}
                r2={runningStats.awaySot}
              />
              <LiveStatRow
                label="Serangan Berbahaya"
                v1={runningStats.homeAttacks}
                v2={runningStats.awayAttacks}
                r1={runningStats.homeAttacks}
                r2={runningStats.awayAttacks}
              />
              <LiveStatRow
                label="Sepak Pojok"
                v1={runningStats.homeCorners}
                v2={runningStats.awayCorners}
                r1={runningStats.homeCorners}
                r2={runningStats.awayCorners}
              />
              <LiveStatRow
                label="Penyelamatan Kiper"
                v1={runningStats.homeSaves}
                v2={runningStats.awaySaves}
                r1={runningStats.homeSaves}
                r2={runningStats.awaySaves}
              />
              <LiveStatRow
                label="Pelanggaran"
                v1={runningStats.homeFouls}
                v2={runningStats.awayFouls}
                r1={runningStats.homeFouls}
                r2={runningStats.awayFouls}
              />
            </div>
          </div>

          {/* Quick Team Tactics Overview */}
          <div className="border-t border-white/5 pt-3">
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="font-bold text-blue-400 block truncate">{matchResult.homeTeamName}</span>
                <span className="text-slate-400 capitalize">Mental: {matchResult.homeTactics.mentality} • {matchResult.homeTactics.passingStyle}</span>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="font-bold text-red-400 block truncate">{matchResult.awayTeamName}</span>
                <span className="text-slate-400 capitalize">Mental: {matchResult.awayTactics.mentality} • {matchResult.awayTactics.passingStyle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATCH RESULTS — DIRECTLY DISPLAYED BELOW AFTER MATCH FINISHES */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="pt-6 border-t border-white/10"
          >
            <MatchResultScreen
              result={matchResult}
              onReplay={handleReplay}
              onBackToSetup={onBackToSetup || (() => {})}
              onNewDraft={onNewDraft || (() => {})}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// LIVE STAT ROW COMPONENT
// =====================================================

function LiveStatRow({
  label, v1, v2, r1, r2,
}: {
  label: string;
  v1: string | number;
  v2: string | number;
  r1: number;
  r2: number;
}) {
  const total = r1 + r2;
  const p1 = total > 0 ? (r1 / total) * 100 : 50;
  const p2 = total > 0 ? (r2 / total) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-mono font-bold text-blue-400">{v1}</span>
        <span className="text-slate-400 text-[10px] font-semibold">{label}</span>
        <span className="font-mono font-bold text-red-400">{v2}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex ring-1 ring-white/5">
        <motion.div
          className="h-full bg-blue-500 rounded-l-full"
          animate={{ width: `${p1}%` }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="h-full bg-red-500 rounded-r-full"
          animate={{ width: `${p2}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// =====================================================
// HELPERS
// =====================================================

function getEventStyle(type: string): string {
  switch (type) {
    case 'goal':
      return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-100 ring-1 ring-emerald-500/30';
    case 'penaltyKick':
      return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-100 ring-1 ring-amber-500/30';
    case 'save':
      return 'bg-blue-500/15 border-blue-500/30 text-blue-200';
    case 'shotOnTarget':
    case 'shot':
      return 'bg-amber-500/15 border-amber-500/30 text-amber-200';
    case 'shotOffTarget':
    case 'blockedShot':
      return 'bg-slate-800/50 border-white/10 text-slate-300';
    case 'dangerousAttack':
    case 'counterAttack':
      return 'bg-orange-500/15 border-orange-500/30 text-orange-200';
    case 'interception':
    case 'tackle':
      return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200';
    case 'corner':
    case 'freeKick':
      return 'bg-purple-500/10 border-purple-500/25 text-purple-200';
    case 'offside':
      return 'bg-orange-500/10 border-orange-500/20 text-orange-300';
    case 'foul':
      return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
    case 'halftime':
    case 'fulltime':
    case 'kickoff':
    case 'secondHalfStart':
    case 'extraTimeFirstHalfStart':
    case 'extraTimeHalftime':
    case 'extraTimeSecondHalfStart':
    case 'extraTimeFulltime':
    case 'penaltyShootoutStart':
    case 'penaltyShootoutEnd':
      return 'bg-slate-700/50 border-white/10 text-slate-200 font-semibold';
    default:
      return 'bg-slate-950/70 border-white/5 text-slate-300';
  }
}
