'use client';

import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Award, Star, Shield, Target, BarChart3,
  RotateCcw, Swords, ArrowRight, Users, Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Button from '@/components/common/Button';
import {
  MatchResult,
  PlayerMatchPerformance,
  TeamMatchStats,
} from '@/types/game';

interface MatchResultScreenProps {
  result: MatchResult;
  onReplay: () => void;
  onNewDraft: () => void;
  onBackToSetup: () => void;
}

export default function MatchResultScreen({
  result, onReplay, onNewDraft, onBackToSetup,
}: MatchResultScreenProps) {
  const {
    homeScore, awayScore, homeTeamName, awayTeamName, homeStats, awayStats, motm,
    winnerTeam, wentToExtraTime, wentToPenalties, homePenalties, awayPenalties, penaltyShootout,
  } = result;

  const winnerName = winnerTeam === 'home' ? homeTeamName : awayTeamName;

  // Confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899'],
    });
  }, []);

  // Goal scorers timeline
  const goalEvents = useMemo(() =>
    result.events.filter(e => e.type === 'goal'),
    [result.events]
  );

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Result Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 p-6 text-center ring-1 ring-emerald-500/30 shadow-2xl"
      >
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {wentToPenalties ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              SELESAI LEWAT ADU PENALTI
            </span>
          ) : wentToExtraTime ? (
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              SELESAI LEWAT EXTRA TIME (120&apos;)
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
              SELESAI 90 MENIT
            </span>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-6 mb-3">
          <div className="text-center">
            <p className="text-sm font-bold text-blue-400 mb-1">🔵 {homeTeamName}</p>
            <p className="text-[10px] text-slate-500 font-mono">{result.homeFormation}</p>
          </div>
          <div className="font-mono text-4xl sm:text-5xl font-black text-amber-400 bg-slate-950 rounded-2xl px-6 py-3 border border-amber-500/30">
            {homeScore} <span className="text-slate-500 text-3xl">-</span> {awayScore}
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-red-400 mb-1">{awayTeamName} 🔴</p>
            <p className="text-[10px] text-slate-500 font-mono">{result.awayFormation}</p>
          </div>
        </div>

        {/* Penalty Score Display if Went to Shootout */}
        {wentToPenalties && (
          <div className="mb-4 inline-flex items-center gap-2 bg-slate-950/80 px-4 py-1.5 rounded-xl border border-amber-500/30">
            <span className="text-xs text-slate-400 font-medium">Skor Adu Penalti:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              ({homePenalties ?? 0} - {awayPenalties ?? 0})
            </span>
          </div>
        )}

        {/* Winner Announcement */}
        <div className="flex items-center justify-center gap-2">
          <Trophy size={24} className="text-amber-400 animate-bounce" />
          <p className="text-lg sm:text-xl font-black text-white">
            🏆 {winnerName} Menang!
            {wentToPenalties && (
              <span className="text-xs sm:text-sm font-normal text-amber-300 block sm:inline sm:ml-2">
                (Adu Penalti {homePenalties} - {awayPenalties})
              </span>
            )}
            {wentToExtraTime && !wentToPenalties && (
              <span className="text-xs sm:text-sm font-normal text-indigo-300 block sm:inline sm:ml-2">
                (Extra Time)
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Penalty Shootout Details Card (if applicable) */}
      {wentToPenalties && penaltyShootout && penaltyShootout.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-slate-900 p-4 ring-1 ring-white/10"
        >
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            🎯 Rekap Adu Penalti
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {penaltyShootout.map((kick, i) => (
              <div
                key={i}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                  kick.outcome === 'goal'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400">
                    R{kick.round}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    kick.team === 'home' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {kick.team === 'home' ? 'Home' : 'Away'}
                  </span>
                  <span className="font-semibold text-white truncate max-w-[130px]">{kick.kickerName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[11px]">
                    {kick.outcome === 'goal' ? '⚽ Gol' : kick.outcome === 'save' ? '🧤 Ditepis' : '💨 Melenceng'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    ({kick.homeScoreAfter}-{kick.awayScoreAfter})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Goal Scorers */}
      {goalEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-slate-900 p-4 ring-1 ring-white/10"
        >
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Target size={14} /> Pencetak Gol
          </h3>
          <div className="space-y-2">
            {goalEvents.map((ev, i) => (
              <div key={ev.id} className="flex items-center gap-3 text-xs">
                <span className="font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded w-10 text-center">
                  {ev.minute}&apos;
                </span>
                <span className="text-lg">⚽</span>
                <span className="font-semibold text-white">{ev.scorer}</span>
                {ev.assister && (
                  <span className="text-slate-500">(assist: {ev.assister})</span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  ev.team === 'home' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {ev.team === 'home' ? homeTeamName : awayTeamName}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Match Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10 space-y-4"
      >
        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 size={14} /> Statistik Pertandingan
        </h3>

        <div className="space-y-3">
          <StatBar label="Penguasaan Bola" v1={`${homeStats.possession}%`} v2={`${awayStats.possession}%`} r1={homeStats.possession} r2={awayStats.possession} />
          <StatBar label="Total Tembakan" v1={homeStats.shots} v2={awayStats.shots} r1={homeStats.shots} r2={awayStats.shots} />
          <StatBar label="Tembakan Tepat Sasaran" v1={homeStats.shotsOnTarget} v2={awayStats.shotsOnTarget} r1={homeStats.shotsOnTarget} r2={awayStats.shotsOnTarget} />
          <StatBar label="Tembakan Melenceng" v1={homeStats.shotsOffTarget} v2={awayStats.shotsOffTarget} r1={homeStats.shotsOffTarget} r2={awayStats.shotsOffTarget} />
          <StatBar label="Tembakan Diblok" v1={homeStats.blockedShots} v2={awayStats.blockedShots} r1={homeStats.blockedShots} r2={awayStats.blockedShots} />
          <StatBar label="Sepak Pojok" v1={homeStats.corners} v2={awayStats.corners} r1={homeStats.corners} r2={awayStats.corners} />
          <StatBar label="Serangan Berbahaya" v1={homeStats.dangerousAttacks} v2={awayStats.dangerousAttacks} r1={homeStats.dangerousAttacks} r2={awayStats.dangerousAttacks} />
          <StatBar label="Akurasi Umpan" v1={`${homeStats.passAccuracy}%`} v2={`${awayStats.passAccuracy}%`} r1={homeStats.passAccuracy} r2={awayStats.passAccuracy} />
          <StatBar label="Penyelamatan" v1={homeStats.saves} v2={awayStats.saves} r1={homeStats.saves} r2={awayStats.saves} />
          <StatBar label="Tekel" v1={homeStats.tackles} v2={awayStats.tackles} r1={homeStats.tackles} r2={awayStats.tackles} />
          <StatBar label="Intersepsi" v1={homeStats.interceptions} v2={awayStats.interceptions} r1={homeStats.interceptions} r2={awayStats.interceptions} />
          <StatBar label="Offside" v1={homeStats.offsides} v2={awayStats.offsides} r1={homeStats.offsides} r2={awayStats.offsides} />
          <StatBar label="Pelanggaran" v1={homeStats.fouls} v2={awayStats.fouls} r1={homeStats.fouls} r2={awayStats.fouls} />
        </div>
      </motion.div>

      {/* Man of the Match */}
      {motm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-900 p-5 ring-1 ring-amber-500/30 text-center space-y-3 shadow-xl"
        >
          <Award size={36} className="mx-auto text-amber-400 animate-bounce" />
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
            🌟 Man of the Match
          </div>
          <h4 className="text-xl font-black text-white">{motm.playerName}</h4>
          <div className="flex items-center justify-center gap-1.5">
            <Star size={18} fill="#F59E0B" className="text-amber-400" />
            <span className="font-mono text-2xl font-black text-amber-400">{motm.rating}</span>
          </div>
          <p className="text-xs text-slate-400">{motm.position} • {motm.naturalPosition !== motm.position ? `(alami: ${motm.naturalPosition})` : ''}</p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-300">
            {motm.goals > 0 && <span>⚽ {motm.goals} Gol</span>}
            {motm.assists > 0 && <span>🅰️ {motm.assists} Assist</span>}
            {motm.saves > 0 && <span>🧤 {motm.saves} Save</span>}
            {motm.shotsOnTarget > 0 && <span>🎯 {motm.shotsOnTarget} SOT</span>}
            {motm.tackles > 0 && <span>💪 {motm.tackles} Tekel</span>}
          </div>
        </motion.div>
      )}

      {/* Player Ratings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlayerRatingsTable
          teamName={homeTeamName}
          performances={result.homePlayerPerformances}
          color="blue"
        />
        <PlayerRatingsTable
          teamName={awayTeamName}
          performances={result.awayPlayerPerformances}
          color="red"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Button size="lg" variant="primary" onClick={onReplay}>
          <RotateCcw size={16} />
          Simulasi Ulang Match
        </Button>
        <Button size="md" variant="secondary" onClick={onBackToSetup}>
          <Swords size={14} />
          Ubah Formasi/Taktik
        </Button>
        <Button size="md" variant="ghost" onClick={onNewDraft}>
          <Users size={14} />
          Draft Ulang Skuad
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// SUB-COMPONENTS
// =====================================================

function StatBar({
  label, v1, v2, r1, r2,
}: {
  label: string;
  v1: string | number;
  v2: string | number;
  r1: number;
  r2: number;
}) {
  const total = (r1 || 0) + (r2 || 0);
  const p1 = total > 0 ? (r1 / total) * 100 : 50;
  const p2 = total > 0 ? (r2 / total) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-mono font-bold text-blue-400">{v1}</span>
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-bold text-red-400">{v2}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: '50%' }}
          animate={{ width: `${p1}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-red-500"
          initial={{ width: '50%' }}
          animate={{ width: `${p2}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function PlayerRatingsTable({
  teamName, performances, color,
}: {
  teamName: string;
  performances: PlayerMatchPerformance[];
  color: 'blue' | 'red';
}) {
  const accentColor = color === 'blue' ? '#3B82F6' : '#EF4444';
  const emoji = color === 'blue' ? '🔵' : '🔴';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl bg-slate-900 ring-1 ring-white/10 overflow-hidden"
    >
      <div className="px-4 py-2.5 border-b border-white/10" style={{ backgroundColor: `${accentColor}10` }}>
        <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: accentColor }}>
          {emoji} {teamName} — Rating Pemain
        </h4>
      </div>

      <div className="divide-y divide-white/5">
        {performances.map(p => {
          const ratingColor = p.rating >= 8.0 ? 'text-emerald-400' :
                              p.rating >= 7.0 ? 'text-amber-400' :
                              p.rating >= 6.5 ? 'text-slate-300' :
                              'text-red-400';

          return (
            <div key={p.playerId} className="flex items-center justify-between px-4 py-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 w-7 text-center font-mono text-[10px] font-bold text-slate-500 bg-slate-800 rounded px-1 py-0.5">
                  {p.position}
                </span>
                <div className="min-w-0">
                  <span className={`font-semibold text-white truncate block ${p.isMotm ? 'text-amber-400' : ''}`}>
                    {p.isMotm && '⭐ '}{p.playerName}
                  </span>
                  {p.naturalPosition !== p.position && (
                    <span className="text-[9px] text-orange-400">alami: {p.naturalPosition}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  {p.goals > 0 && <span>⚽{p.goals}</span>}
                  {p.assists > 0 && <span>🅰️{p.assists}</span>}
                  {p.saves > 0 && <span>🧤{p.saves}</span>}
                </div>
                <div className={`font-mono font-black text-sm ${ratingColor} bg-slate-800 rounded-lg px-2 py-0.5 min-w-[2.5rem] text-center`}>
                  {p.rating.toFixed(1)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
