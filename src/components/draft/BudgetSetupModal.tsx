'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Wallet, Sparkles, ChevronRight, Star, Scale, Shield } from 'lucide-react';
import Button from '@/components/common/Button';
import { DraftPair } from '@/types/game';

interface BudgetSetupModalProps {
  onStart: (p1Name: string, p2Name: string, budget: number, pairs: DraftPair[]) => void;
}

const BUDGET_OPTIONS = [
  { label: '30K', value: 30000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
  { label: '200K', value: 200000 },
];

const PLAYER_TIER_OPTIONS = [
  {
    value: 'top_tier',
    label: '🌟 Pemain Top World-Class',
    desc: 'Semua pemain bintang kelas dunia tersohor (Mbappé, Haaland, Vinícius, Bellingham, Salah, Rodri, De Bruyne)',
    icon: <Star size={16} className="text-amber-400" fill="#F59E0B" />,
  },
  {
    value: 'mix_tier',
    label: '⚖️ Campuran (Top & Underrated)',
    desc: 'Kombinasi seimbang antara bintang populer dan pemain hebat yang kurang disorot media',
    icon: <Scale size={16} className="text-emerald-400" />,
  },
  {
    value: 'normal_tier',
    label: '⚽ Pemain Biasa / Hidden Gems',
    desc: 'Pemain liga profesional solid yang kurang tersorot media (Tetap pemain asli sepak bola, tanpa pemain fiktif)',
    icon: <Shield size={16} className="text-blue-400" />,
  },
];

export default function BudgetSetupModal({ onStart }: BudgetSetupModalProps) {
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [budget, setBudget] = useState(50000);
  const [theme, setTheme] = useState('top_tier');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!p1Name.trim() || !p2Name.trim()) {
      setError('Nama kedua pemain harus diisi');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/groq/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, theme }),
      });

      if (!res.ok) throw new Error('Gagal generate draft');

      const data = await res.json();
      onStart(p1Name.trim(), p2Name.trim(), budget, data.rounds);
    } catch {
      setError('Gagal terhubung ke AI. Pastikan GROQ_API_KEY sudah diset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg space-y-5"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30">
            <Users size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">1v1 Draft Auction</h1>
          <p className="mt-1 text-sm text-slate-400">Susun skuad 4-3-3 terbaik dengan budget terbatas</p>
        </div>

        {/* Player names */}
        <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Pemain</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-blue-400 font-semibold">🔵 Pemain 1</label>
              <input
                type="text"
                value={p1Name}
                onChange={e => setP1Name(e.target.value)}
                placeholder="Nama kamu"
                className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-red-400 font-semibold">🔴 Pemain 2</label>
              <input
                type="text"
                value={p2Name}
                onChange={e => setP2Name(e.target.value)}
                placeholder="Nama lawan"
                className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-red-500/50"
              />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wallet size={12} /> Budget Per Pemain
            </p>
            <span className="font-mono text-sm font-bold text-amber-400">
              Rp {budget.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {BUDGET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBudget(opt.value)}
                className={`rounded-xl py-2 text-sm font-bold font-mono transition-all ${
                  budget === opt.value
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="10000"
            max="500000"
            step="5000"
            value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Player Pool Tier Category */}
        <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles size={12} /> Kategori Pemain Bola Dalam Draft
          </p>
          <div className="space-y-2">
            {PLAYER_TIER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-left transition-all ring-1 ${
                  theme === opt.value
                    ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/50 shadow-lg'
                    : 'bg-slate-900/90 text-slate-400 ring-white/5 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-white mb-0.5">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-tight pl-6">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          loading={loading}
          disabled={!p1Name.trim() || !p2Name.trim()}
          onClick={handleStart}
        >
          {loading ? 'Generating Squad...' : (
            <>
              <Sparkles size={16} />
              Mulai Draft!
              <ChevronRight size={16} />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
