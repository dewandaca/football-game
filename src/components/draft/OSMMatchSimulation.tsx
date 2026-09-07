'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, FastForward, RotateCcw, Flame, Zap, Award, Star, Lock, ShieldCheck, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FootballPlayer, PlayerState } from '@/types/game';
import Button from '@/components/common/Button';
import MiniPitch from '@/components/draft/MiniPitch';

interface OSMMatchSimulationProps {
  player1: PlayerState;
  player2: PlayerState;
  onResetDraft: () => void;
}

interface MatchEvent {
  minute: number;
  type:
    | 'kickoff'
    | 'goal'
    | 'save'
    | 'miss'
    | 'woodwork'
    | 'yellow'
    | 'red'
    | 'foul'
    | 'var_check'
    | 'offside'
    | 'handball'
    | 'tackle'
    | 'corner'
    | 'halftime'
    | 'fulltime'
    | 'penalty_start'
    | 'penalty_kick';
  team: 'player1' | 'player2' | 'neutral';
  commentary: string;
  scorer?: FootballPlayer;
  score1: number;
  score2: number;
  penalties1?: number;
  penalties2?: number;
  penaltyDots1?: ('goal' | 'miss')[];
  penaltyDots2?: ('goal' | 'miss')[];
}

export default function OSMMatchSimulation({
  player1,
  player2,
  onResetDraft,
}: OSMMatchSimulationProps) {
  // Calculate Team Ratings
  const p1Stats = useMemo(() => calculateTeamStats(player1.squad), [player1.squad]);
  const p2Stats = useMemo(() => calculateTeamStats(player2.squad), [player2.squad]);

  // Generate Match Simulation Events (No draws - includes penalty shootout if tied)
  const events = useMemo(
    () => generateOSMMatchEvents(player1, player2, p1Stats, p2Stats),
    [player1, player2, p1Stats, p2Stats]
  );

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(2500); // Default slower pace: 2.5s per event

  const commentaryContainerRef = useRef<HTMLDivElement>(null);

  const currentEvent = events[currentEventIndex] || events[events.length - 1];
  const isFinished = currentEventIndex >= events.length - 1;

  // Auto scroll ONLY the commentary text container to bottom (without scrolling the main page)
  useEffect(() => {
    if (commentaryContainerRef.current) {
      commentaryContainerRef.current.scrollTo({
        top: commentaryContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [currentEventIndex]);

  // Auto tick timer
  useEffect(() => {
    if (!isPlaying || isFinished) return;

    const timer = setInterval(() => {
      setCurrentEventIndex((prev) => {
        if (prev >= events.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);

    return () => clearInterval(timer);
  }, [isPlaying, isFinished, speedMs, events.length]);

  // Fire confetti on match end
  useEffect(() => {
    if (isFinished) {
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899'],
      });
    }
  }, [isFinished]);

  const handleSkipToEnd = () => {
    setCurrentEventIndex(events.length - 1);
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setCurrentEventIndex(0);
    setIsPlaying(true);
  };

  // Find Man of the Match (MOTM)
  const motm = useMemo(() => {
    const goalsScored = events.filter((e) => e.type === 'goal' && e.scorer);
    if (goalsScored.length > 0) {
      return goalsScored[goalsScored.length - 1].scorer;
    }
    const all = [...player1.squad, ...player2.squad];
    return all.sort((a, b) => b.rating - a.rating)[0];
  }, [events, player1.squad, player2.squad]);

  // Determine final winner (regulation or penalty shootout)
  const finalEvent = events[events.length - 1];
  const winningTeam = useMemo(() => {
    if (finalEvent.penalties1 !== undefined && finalEvent.penalties2 !== undefined) {
      return finalEvent.penalties1 > finalEvent.penalties2 ? player1.name : player2.name;
    }
    return finalEvent.score1 > finalEvent.score2
      ? player1.name
      : finalEvent.score2 > finalEvent.score1
      ? player2.name
      : player1.name; // Fallback
  }, [finalEvent, player1.name, player2.name]);

  const isPenaltyPhase = currentEvent.penalties1 !== undefined || currentEvent.type === 'penalty_start' || currentEvent.type === 'penalty_kick';

  return (
    <div className="mx-auto max-w-4xl px-4 space-y-6 pb-12">
      {/* Header Banner */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
          <Flame size={14} className="text-emerald-400 animate-pulse" />
          SIMULASI DRAMATIS OSM (ONLINE SOCCER MANAGER)
        </div>
        <h1 className="text-2xl font-extrabold text-white">4-3-3 Championship Final</h1>
      </div>

      {/* Main Scoreboard */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 ring-1 ring-white/10 shadow-2xl relative overflow-hidden space-y-4">
        {/* Live Minute / Penalty Badge */}
        <div className="flex justify-center">
          <span className="rounded-full bg-slate-950/90 px-4 py-1 font-mono text-xs font-bold text-amber-400 ring-1 ring-amber-500/30 shadow-lg">
            {isPenaltyPhase
              ? '🎯 ADU PENALTI'
              : `${currentEvent.minute}' ${isFinished ? '(SELESAI)' : 'LIVE'}`}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 text-center">
          {/* Player 1 Team */}
          <div className="flex-1 text-center space-y-1 min-w-0">
            <span className="text-sm sm:text-base font-bold text-blue-400 block truncate">🔵 {player1.name}</span>
            <p className="text-xs text-slate-400 font-medium">Rating Skuad: ⭐ {p1Stats.overall}</p>
          </div>

          {/* Score Display */}
          <div className="shrink-0 space-y-1">
            <motion.div
              key={`${currentEvent.score1}-${currentEvent.score2}`}
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center gap-3 font-mono text-3xl sm:text-4xl font-black text-amber-400 whitespace-nowrap bg-slate-950/95 rounded-2xl py-2.5 px-6 border border-amber-500/40 shadow-2xl tracking-normal"
            >
              <span>{currentEvent.score1}</span>
              <span className="text-slate-500 font-sans font-semibold text-2xl">-</span>
              <span>{currentEvent.score2}</span>
            </motion.div>

            {/* Penalty Shootout Score Badge */}
            {isPenaltyPhase && currentEvent.penalties1 !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/30"
              >
                Penalti: ({currentEvent.penalties1} - {currentEvent.penalties2})
              </motion.div>
            )}
          </div>

          {/* Player 2 Team */}
          <div className="flex-1 text-center space-y-1 min-w-0">
            <span className="text-sm sm:text-base font-bold text-red-400 block truncate">🔴 {player2.name}</span>
            <p className="text-xs text-slate-400 font-medium">Rating Skuad: ⭐ {p2Stats.overall}</p>
          </div>
        </div>

        {/* Penalty Dots Indicator (If during/after Penalty shootout) */}
        {isPenaltyPhase && (currentEvent.penaltyDots1 || currentEvent.penaltyDots2) && (
          <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-xs font-mono">
            {/* Team 1 Penalty Dots */}
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-blue-400 font-bold text-[10px] mr-1">🔵 {player1.name}:</span>
              {(currentEvent.penaltyDots1 || []).map((dot, idx) => (
                <span
                  key={idx}
                  className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                    dot === 'goal' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-red-500/80 text-white'
                  }`}
                >
                  {dot === 'goal' ? '✓' : '✗'}
                </span>
              ))}
            </div>

            {/* Team 2 Penalty Dots */}
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-red-400 font-bold text-[10px] mr-1">🔴 {player2.name}:</span>
              {(currentEvent.penaltyDots2 || []).map((dot, idx) => (
                <span
                  key={idx}
                  className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                    dot === 'goal' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-red-500/80 text-white'
                  }`}
                >
                  {dot === 'goal' ? '✓' : '✗'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tactical Rating Comparison Bars */}
        <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center text-xs">
          <StatCompareBar label="Serangan (ATT)" v1={p1Stats.attack} v2={p2Stats.attack} />
          <StatCompareBar label="Lini Tengah (MID)" v1={p1Stats.midfield} v2={p2Stats.midfield} />
          <StatCompareBar label="Pertahanan (DEF)" v1={p1Stats.defense} v2={p2Stats.defense} />
        </div>
      </div>

      {/* Control Buttons with Pacing Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl ring-1 ring-white/5">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={isFinished}
          >
            <Play size={14} className={isPlaying ? 'rotate-90' : ''} />
            {isPlaying ? 'Pause' : 'Mulai Tanding'}
          </Button>

          <Button size="sm" variant="ghost" onClick={handleSkipToEnd} disabled={isFinished}>
            <FastForward size={14} />
            Langsung Hasil Akhir
          </Button>

          {isFinished && (
            <Button size="sm" variant="primary" onClick={handleReplay}>
              <RotateCcw size={14} />
              Simulasi Ulang Match
            </Button>
          )}
        </div>

        {/* Pacing Speed Options */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1">Kecepatan:</span>
          {[
            { label: 'Santai (2.5s)', speed: 2500 },
            { label: 'Sedang (1.5s)', speed: 1500 },
            { label: 'Cepat (0.8s)', speed: 800 },
          ].map((opt) => (
            <button
              key={opt.speed}
              onClick={() => setSpeedMs(opt.speed)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all ${
                speedMs === opt.speed
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Commentary & Visual Arena */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Live Commentary Stream (2 cols) */}
        <div className="md:col-span-2 rounded-2xl bg-slate-900/90 p-5 ring-1 ring-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap size={14} /> Komentar Teks Pertandingan (Live Commentary)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              Event {currentEventIndex + 1}/{events.length}
            </span>
          </div>

          <div ref={commentaryContainerRef} className="h-72 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            <AnimatePresence initial={false}>
              {events.slice(0, currentEventIndex + 1).map((ev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all shadow-md ${
                    ev.type === 'goal'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-100 ring-1 ring-emerald-500/30'
                      : ev.type === 'penalty_kick'
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-100'
                      : ev.type === 'var_check'
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 ring-1 ring-indigo-500/30 font-semibold'
                      : ev.type === 'red'
                      ? 'bg-red-500/20 border-red-500/50 text-red-200 ring-1 ring-red-500/30 font-bold'
                      : ev.type === 'penalty_start'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 font-bold'
                      : ev.type === 'woodwork' || ev.type === 'save'
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-200'
                      : ev.type === 'yellow' || ev.type === 'foul' || ev.type === 'handball'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                      : ev.type === 'offside'
                      ? 'bg-orange-500/15 border-orange-500/30 text-orange-200'
                      : ev.type === 'tackle'
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200'
                      : 'bg-slate-950/70 border-white/5 text-slate-300'
                  }`}
                >
                  <span className="font-mono font-bold text-amber-400 shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-white/5">
                    {ev.minute > 90 ? `ADU PENALTI` : `${ev.minute}'`}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-relaxed">{ev.commentary}</p>
                    {ev.type === 'goal' && (
                      <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block flex items-center gap-1">
                        ⚽ GOOOOLLLL! ({ev.score1} - {ev.score2})
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* MOTM & Post-Match Stats (Revealed at End) */}
        <div className="space-y-4">
          {!isFinished ? (
            /* Stats Locked Placeholder during active match */
            <div className="rounded-2xl bg-slate-900/80 p-6 border border-white/10 text-center space-y-3 flex flex-col items-center justify-center min-h-[260px]">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center ring-1 ring-amber-500/30 animate-pulse">
                <Lock size={22} />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Statistik Pertandingan Locked</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                Statistik penguasaan bola, total tembakan, dan <span className="text-amber-400 font-semibold">Man of the Match</span> akan dirilis secara otomatis saat pertandingan selesai! ⏳
              </p>
            </div>
          ) : (
            /* Revealed Stats at Match End */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Man of the Match */}
              {motm && (
                <div className="rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-900 p-4 ring-1 ring-amber-500/30 text-center space-y-2 shadow-xl">
                  <Award size={28} className="mx-auto text-amber-400 animate-bounce" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                    🌟 Man of the Match
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <Star size={14} fill="#F59E0B" className="text-amber-400" />
                    <span className="font-mono text-base font-bold text-amber-400">{motm.rating}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{motm.name}</h4>
                  <p className="text-xs text-slate-400">{motm.club} ({motm.position})</p>
                </div>
              )}

              {/* Match Stats Box */}
              <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-white/10 space-y-3 text-xs shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" /> Statistik Pertandingan
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Resmi
                  </span>
                </div>
                <div className="space-y-2.5">
                  <StatRow label="Penguasaan Bola" v1={`${p1Stats.possession}%`} v2={`${p2Stats.possession}%`} />
                  <StatRow label="Total Tembakan" v1={p1Stats.shots} v2={p2Stats.shots} />
                  <StatRow label="Tembakan Tepat" v1={p1Stats.shotsOnTarget} v2={p2Stats.shotsOnTarget} />
                  <StatRow label="Akurasi Umpan" v1={`${p1Stats.passAcc}%`} v2={`${p2Stats.passAcc}%`} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mini Pitches Lineup Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <MiniPitch squad={player1.squad} label={player1.name} color="blue" />
        <MiniPitch squad={player2.squad} label={player2.name} color="red" />
      </div>

      {/* Match Result Banner when finished */}
      {isFinished && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 p-6 text-center ring-1 ring-emerald-500/30 space-y-4 shadow-2xl"
        >
          <Trophy size={44} className="mx-auto text-amber-400 animate-bounce" />
          <h2 className="text-2xl font-bold text-white">
            🏆 {winningTeam} Memenangkan Pertandingan!
          </h2>
          <p className="text-sm text-slate-300">
            {finalEvent.penalties1 !== undefined
              ? `Menang Lewat Adu Penalti: (${finalEvent.penalties1} - ${finalEvent.penalties2}) (Skor Reguler: ${finalEvent.score1} - ${finalEvent.score2})`
              : `Skor Akhir: ${finalEvent.score1} - ${finalEvent.score2}`}
          </p>

          <Button size="lg" variant="secondary" onClick={onResetDraft}>
            <RotateCcw size={16} />
            Draft Ulang Skuad Baru
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function StatCompareBar({ label, v1, v2 }: { label: string; v1: number; v2: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] font-semibold text-slate-300">
        <span className="text-blue-400 font-mono">{v1}</span>
        <span className="text-slate-400">{label}</span>
        <span className="text-red-400 font-mono">{v2}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden flex">
        <div className="h-full bg-blue-500" style={{ width: `${(v1 / (v1 + v2)) * 100}%` }} />
        <div className="h-full bg-red-500" style={{ width: `${(v2 / (v1 + v2)) * 100}%` }} />
      </div>
    </div>
  );
}

function StatRow({ label, v1, v2 }: { label: string; v1: string | number; v2: string | number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-mono font-bold text-blue-400">{v1}</span>
      <span className="text-slate-400">{label}</span>
      <span className="font-mono font-bold text-red-400">{v2}</span>
    </div>
  );
}

function calculateTeamStats(squad: FootballPlayer[]) {
  if (!squad || squad.length === 0) {
    return { overall: 0, attack: 0, midfield: 0, defense: 0, possession: 50, shots: 0, shotsOnTarget: 0, passAcc: 80 };
  }

  const fwds = squad.filter((p) => ['ST', 'RW', 'LW'].includes(p.position));
  const mids = squad.filter((p) => ['CM', 'CDM', 'CAM'].includes(p.position));
  const defs = squad.filter((p) => ['CB', 'LB', 'RB', 'GK'].includes(p.position));

  const avg = (arr: FootballPlayer[]) =>
    arr.length > 0 ? Math.round(arr.reduce((sum, p) => sum + p.rating, 0) / arr.length) : 75;

  const attack = avg(fwds.length > 0 ? fwds : squad);
  const midfield = avg(mids.length > 0 ? mids : squad);
  const defense = avg(defs.length > 0 ? defs : squad);
  const overall = Math.round((attack + midfield + defense) / 3);

  const possession = Math.min(68, Math.max(32, 50 + (midfield - 80) * 1.5));
  const shots = Math.max(4, Math.round(attack / 6.5));
  const shotsOnTarget = Math.max(2, Math.round(shots * 0.55));
  const passAcc = Math.min(94, Math.max(70, Math.round(midfield * 0.95)));

  return { overall, attack, midfield, defense, possession: Math.round(possession), shots, shotsOnTarget, passAcc };
}

/**
 * Generate exciting match events with dramatic commentary.
 * Uses procedural random pools so events vary uniquely across matches!
 * NEVER DRAWS! Proceeds to Penalty Shootout if tied after 90'.
 */
function generateOSMMatchEvents(
  p1: PlayerState,
  p2: PlayerState,
  s1: ReturnType<typeof calculateTeamStats>,
  s2: ReturnType<typeof calculateTeamStats>
): MatchEvent[] {
  const events: MatchEvent[] = [];
  let score1 = 0;
  let score2 = 0;

  // Players extraction helper
  const getP = (squad: FootballPlayer[], posGroup: string[], fallbackIdx: number) =>
    squad.find((p) => posGroup.includes(p.position)) || squad[fallbackIdx] || squad[0];

  const st1 = getP(p1.squad, ['ST'], 0);
  const st2 = getP(p2.squad, ['ST'], 0);
  const rw1 = getP(p1.squad, ['RW', 'LW', 'CAM'], 1);
  const lw1 = getP(p1.squad, ['LW', 'RW', 'CM'], 2);
  const rw2 = getP(p2.squad, ['RW', 'LW', 'CAM'], 1);
  const lw2 = getP(p2.squad, ['LW', 'RW', 'CM'], 2);
  const cm1 = getP(p1.squad, ['CM', 'CDM', 'CAM'], 3);
  const cm2 = getP(p2.squad, ['CM', 'CDM', 'CAM'], 3);
  const def1 = getP(p1.squad, ['CB', 'LB', 'RB'], 4);
  const def2 = getP(p2.squad, ['CB', 'LB', 'RB'], 4);
  const gk1 = getP(p1.squad, ['GK'], 10);
  const gk2 = getP(p2.squad, ['GK'], 10);

  // Kickoff
  events.push({
    minute: 1,
    type: 'kickoff',
    team: 'neutral',
    commentary: `🔥 PELUIT PERTAMA BERBUNYI! Atmosfer stadion bergemuruh dahsyat! Pertandingan Final antara ${p1.name} (🔵) vs ${p2.name} (🔴) resmi dimulai!`,
    score1: 0,
    score2: 0,
  });

  const goalProb1 = Math.max(0.12, (s1.attack - s2.defense + 15) / 100);
  const goalProb2 = Math.max(0.12, (s2.attack - s1.defense + 15) / 100);

  // Helper to generate dynamic random timeline minutes
  const firstHalfMinutes = [
    6 + Math.floor(Math.random() * 4),
    14 + Math.floor(Math.random() * 5),
    23 + Math.floor(Math.random() * 5),
    32 + Math.floor(Math.random() * 6),
    40 + Math.floor(Math.random() * 4),
  ];

  const secondHalfMinutes = [
    52 + Math.floor(Math.random() * 4),
    61 + Math.floor(Math.random() * 5),
    71 + Math.floor(Math.random() * 5),
    79 + Math.floor(Math.random() * 4),
    87 + Math.floor(Math.random() * 3),
  ];

  // Random event generator helper
  const createRandomEvent = (minute: number, isSecondHalf: boolean) => {
    const isP1Attacking = Math.random() < s1.midfield / (s1.midfield + s2.midfield);
    const attTeam = isP1Attacking ? 'player1' : 'player2';
    const attName = isP1Attacking ? p1.name : p2.name;
    const defName = isP1Attacking ? p2.name : p1.name;
    const attPlayer = isP1Attacking
      ? Math.random() < 0.6 ? st1 : Math.random() < 0.5 ? rw1 : cm1
      : Math.random() < 0.6 ? st2 : Math.random() < 0.5 ? rw2 : cm2;
    const defPlayer = isP1Attacking ? def2 : def1;
    const oppGk = isP1Attacking ? gk2 : gk1;
    const prob = isP1Attacking ? goalProb1 : goalProb2;

    const eventRoll = Math.random();

    // 1. Goal Event
    if (eventRoll < prob) {
      if (isP1Attacking) score1++;
      else score2++;

      const goalStories = [
        `⚽ GOOOOOLLLL FANTASTIS! Aksi individu spektakuler dari ${attPlayer?.name || 'Penyerang'}! Mengelabuhi pertahanan ${defName} lalu melepaskan tembakan roket mendatar ke pojok kiri gawang!`,
        `⚽ GOOOOOLLLL DINGIN! Umpan terobosan mematikan merobek lini pertahanan ${defName}, ${attPlayer?.name || 'Striker'} tinggal berhadapan dengan kiper dan menyelesaikannya dengan tenang!`,
        `⚽ GOOOOOLLLL INDAH! Tendangan bebas melengkung yang fantastis dari ${attPlayer?.name || 'Pemain'} menghujam tepat ke pojok atas gawang ${defName}! Stadion bergemuruh!`,
        `⚽ GOOOOOLLLL KROSI! Umpan silang tajam disambut dengan sundulan keras oleh ${attPlayer?.name || 'Pemain'} yang tak mampu dijangkau kiper! ${attName} mencetak gol!`,
      ];

      return {
        minute,
        type: 'goal' as const,
        team: attTeam as 'player1' | 'player2',
        commentary: goalStories[Math.floor(Math.random() * goalStories.length)],
        scorer: attPlayer,
        score1,
        score2,
      };
    }

    // 2. VAR Check Event (10% chance)
    if (eventRoll < prob + 0.08) {
      const varOverturn = Math.random() < 0.5;
      if (varOverturn) {
        return {
          minute,
          type: 'var_check' as const,
          team: attTeam as 'player1' | 'player2',
          commentary: `🎥 VAR CHECK! Wasit mengecek tayangan ulang atas dugaan handsball / offside ${attName}... SETELAH MENINJAU MONITOR, WASIT MEMUTUSKAN TIDAK ADA PENALTI! Permainan dilanjutkan.`,
          score1,
          score2,
        };
      } else {
        return {
          minute,
          type: 'var_check' as const,
          team: attTeam as 'player1' | 'player2',
          commentary: `🎥 VAR CHECK! Wasit berkonsultasi dengan ruang VAR terkait insiden di dalam kotak penalti ${defName}... Keputusan Wasit: TEKEL BERSIH! Tidak ada pelanggaran.`,
          score1,
          score2,
        };
      }
    }

    // 3. Woodwork Event (Tiang / Mistar)
    if (eventRoll < prob + 0.18) {
      return {
        minute,
        type: 'woodwork' as const,
        team: attTeam as 'player1' | 'player2',
        commentary: `😱 HAMPIR SAJA! Sepakan keras dentuman meriam dari ${attPlayer?.name || 'Pemain'} MENGHANTAM MISTAR GAWANG ${defName}! Bola rebound berhasil dibuang pertahanan!`,
        score1,
        score2,
      };
    }

    // 4. Save Event (Kiper Terbang / Refleks)
    if (eventRoll < prob + 0.32) {
      return {
        minute,
        type: 'save' as const,
        team: attTeam as 'player1' | 'player2',
        commentary: `🧤 PENYELAMATAN GEMILANG! Tembakan mendatar dari ${attPlayer?.name || 'Pemain'} ditepis secara akrobatik oleh Kiper ${oppGk?.name || defName}! Hanya menghasilkan sepak pojok!`,
        score1,
        score2,
      };
    }

    // 5. Tactical Foul & Yellow/Red Card
    if (eventRoll < prob + 0.46) {
      const isRed = Math.random() < 0.08;
      const defTeam = attTeam === 'player1' ? ('player2' as const) : ('player1' as const);
      if (isRed) {
        return {
          minute,
          type: 'red' as const,
          team: defTeam,
          commentary: `🟥 KARTU MERAH LANGSUNG! Pelanggaran tekel keras tingkat tinggi oleh ${defPlayer?.name || 'Pemain'} untuk menghentikan peluang emas! Wasit tanpa ragu mencabut KARTU MERAH!`,
          score1,
          score2,
        };
      }
      return {
        minute,
        type: 'yellow' as const,
        team: defTeam,
        commentary: `🨨 KARTU KUNING! Tekel taktis dari ${defPlayer?.name || 'Bek'} menghentikan serangan balik cepat ${attName}. Wasit memberikan peringatan keras!`,
        score1,
        score2,
      };
    }

    // 6. Offside Event
    if (eventRoll < prob + 0.58) {
      return {
        minute,
        type: 'offside' as const,
        team: attTeam as 'player1' | 'player2',
        commentary: `🚩 OFFSIDE! Umpan terobosan matang ${attPlayer?.name || 'Pemain'} diselesaikan ke dalam jala, namun hakim garis sudah lebih dulu mengangkat bendera tanda offside!`,
        score1,
        score2,
      };
    }

    // 7. Defensive Tackle & Interception
    if (eventRoll < prob + 0.72) {
      return {
        minute,
        type: 'tackle' as const,
        team: attTeam as 'player1' | 'player2',
        commentary: `🛡️ TEKEL KRUSIAL! ${defPlayer?.name || 'Bek'} melakukan sliding tackle bersih memotong umpan mendatar ${attName} tepat di garis kotak penalti! PERTAHANAN SOLID!`,
        score1,
        score2,
      };
    }

    // 8. Handball & Free Kick Chance
    if (eventRoll < prob + 0.84) {
      return {
        minute,
        type: 'handball' as const,
        team: attTeam as 'player1' | 'player2',
        commentary: `✋ HANDBALL! Pemain pertahanan ${defName} menyentuh bola dengan tangan di luar kotak penalti. Peluang tendangan bebas langsung untuk ${attName}!`,
        score1,
        score2,
      };
    }

    // 9. Shot Miss / High Corner
    return {
      minute,
      type: 'miss' as const,
      team: attTeam as 'player1' | 'player2',
      commentary: `💥 TEMBAKAN SPEKTAKULER! ${attPlayer?.name || 'Pemain'} melepaskan sepakan jarak jauh dari luar kotak penalti, sayang arah bola masih melambung tipis di atas mistar!`,
      score1,
      score2,
    };
  };

  // Generate 1st Half Events
  firstHalfMinutes.forEach((min) => {
    events.push(createRandomEvent(min, false));
  });

  // Halftime (45')
  events.push({
    minute: 45,
    type: 'halftime',
    team: 'neutral',
    commentary: `⏱️ PELUIT BABAK PERTAMA! Pertandingan sengit dengan tensi tinggi sementara berkesudahan dengan skor ${p1.name} ${score1} - ${score2} ${p2.name}.`,
    score1,
    score2,
  });

  // Generate 2nd Half Events
  secondHalfMinutes.forEach((min) => {
    events.push(createRandomEvent(min, true));
  });

  // Minute 89 - Late dramatic goal chance if tied
  if (score1 === score2) {
    const roll = Math.random();
    if (roll < 0.35) {
      score1++;
      events.push({
        minute: 89,
        type: 'goal',
        team: 'player1',
        commentary: `⚽ GOOOOOLLLL MENIT AKHIR! ${st1?.name || 'Pemain'} menjadi pahlawan! Memanfaatkan kemelut di depan gawang untuk menceploskan bola! Stadion meledak gembira!`,
        scorer: st1,
        score1,
        score2,
      });
    } else if (roll < 0.7) {
      score2++;
      events.push({
        minute: 89,
        type: 'goal',
        team: 'player2',
        commentary: `⚽ GOOOOOLLLL MENIT AKHIR! ${st2?.name || 'Pemain'} mencetak gol dramatis! Menyambar bola muntah di area penalti! Drama puncak terjadi!`,
        scorer: st2,
        score1,
        score2,
      });
    }
  }

  // 90' Fulltime check
  if (score1 !== score2) {
    // Definitive winner in regulation!
    events.push({
      minute: 90,
      type: 'fulltime',
      team: 'neutral',
      commentary: `🎺 PELUIT PANJANG BERBUNYI! PERTANDINGAN SELESAI! ${score1 > score2 ? p1.name : p2.name} mengunci kemenangan dramatis dengan skor akhir ${score1} - ${score2}! 🏆🎉`,
      score1,
      score2,
    });
    return events;
  }

  // IF TIED AFTER 90' -> ADU PENALTI (PENALTY SHOOTOUT)! NO DRAWS!
  events.push({
    minute: 90,
    type: 'penalty_start',
    team: 'neutral',
    commentary: `🚨 SKOR IMBANG ${score1} - ${score2} DI MENIT 90! Pertandingan berlanjut ke BABAK ADU PENALTI yang sangat menegangkan untuk menentukan sang Juara Sejati! 🎯🔥`,
    score1,
    score2,
  });

  // Simulate Penalty Shootout
  let pen1 = 0;
  let pen2 = 0;
  const dots1: ('goal' | 'miss')[] = [];
  const dots2: ('goal' | 'miss')[] = [];

  const p1Kickers = p1.squad.slice(0, 5);
  const p2Kickers = p2.squad.slice(0, 5);

  for (let k = 0; k < 5; k++) {
    const kicker1 = p1Kickers[k] || st1;
    const kicker2 = p2Kickers[k] || st2;

    // Kick 1
    const p1Success = Math.random() < 0.75;
    if (p1Success) {
      pen1++;
      dots1.push('goal');
      events.push({
        minute: 91 + k * 2,
        type: 'penalty_kick',
        team: 'player1',
        commentary: `🎯 Penalti Penendang ${k + 1} (${p1.name}): ${kicker1.name} mengambil ancang-ancang... MENEMBAK KERAS KE SUDUT KANAN! GOOOOLLLL! ⚽ (${pen1}-${pen2})`,
        score1,
        score2,
        penalties1: pen1,
        penalties2: pen2,
        penaltyDots1: [...dots1],
        penaltyDots2: [...dots2],
      });
    } else {
      dots1.push('miss');
      events.push({
        minute: 91 + k * 2,
        type: 'penalty_kick',
        team: 'player1',
        commentary: `❌ Penalti Penendang ${k + 1} (${p1.name}): ${kicker1.name} melepaskan tembakan mendatar... KIPER MENEBAK ARAH BOLA DENGAN TEPAT DAN MENEPISNYA! GAGAL! 🧤`,
        score1,
        score2,
        penalties1: pen1,
        penalties2: pen2,
        penaltyDots1: [...dots1],
        penaltyDots2: [...dots2],
      });
    }

    // Kick 2
    const p2Success = Math.random() < 0.72;
    if (p2Success) {
      pen2++;
      dots2.push('goal');
      events.push({
        minute: 92 + k * 2,
        type: 'penalty_kick',
        team: 'player2',
        commentary: `🎯 Penalti Penendang ${k + 1} (${p2.name}): ${kicker2.name} mengarahkan bola ke pojok atas gawang... GOOOOLLLL DINGIN! ⚽ (${pen1}-${pen2})`,
        score1,
        score2,
        penalties1: pen1,
        penalties2: pen2,
        penaltyDots1: [...dots1],
        penaltyDots2: [...dots2],
      });
    } else {
      dots2.push('miss');
      events.push({
        minute: 92 + k * 2,
        type: 'penalty_kick',
        team: 'player2',
        commentary: `❌ Penalti Penendang ${k + 1} (${p2.name}): ${kicker2.name} melepaskan sepakan... BOLA MENGHANTAM MISTAR GAWANG! GAGAL! 😱`,
        score1,
        score2,
        penalties1: pen1,
        penalties2: pen2,
        penaltyDots1: [...dots1],
        penaltyDots2: [...dots2],
      });
    }
  }

  // Sudden death penalty if still tied after 5 kicks!
  if (pen1 === pen2) {
    if (Math.random() < 0.5) {
      pen1++;
      dots1.push('goal');
      dots2.push('miss');
    } else {
      pen2++;
      dots1.push('miss');
      dots2.push('goal');
    }
  }

  const penWinner = pen1 > pen2 ? p1.name : p2.name;

  events.push({
    minute: 105,
    type: 'fulltime',
    team: 'neutral',
    commentary: `🏆 BABAK ADU PENALTI SELESAI! ${penWinner} memenangkan Adu Penalti dengan skor Penalti (${pen1} - ${pen2})! SELAMAT UNTUK SANG JUARA! 🎉🏆`,
    score1,
    score2,
    penalties1: pen1,
    penalties2: pen2,
    penaltyDots1: [...dots1],
    penaltyDots2: [...dots2],
  });

  return events;
}
