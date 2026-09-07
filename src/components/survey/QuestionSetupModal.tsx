'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PenLine, X, Dice6, Users, User, Plus, Trash2, Calendar } from 'lucide-react';
import Button from '@/components/common/Button';
import { SurveyAnswer } from '@/types/game';

interface QuestionSetupModalProps {
  onStart: (
    question: string,
    answers: SurveyAnswer[],
    sourceType: 'ai_generated' | 'custom_input',
    player1Name: string,
    player2Name: string,
    mode: '1player' | '2player'
  ) => void;
}

// ─── Era Options ───────────────────────────────────────────────────────────────
const ERA_OPTIONS = [
  { label: '🌍 Semua Era', value: '' },
  { label: '🏛️ Klasik (≤1989)', value: 'sebelum tahun 1990, era klasik sepak bola' },
  { label: '📼 Era 90an', value: 'tahun 1990 hingga 1999' },
  { label: '💿 Era 2000an', value: 'tahun 2000 hingga 2009' },
  { label: '📱 Era 2010an', value: 'tahun 2010 hingga 2019' },
  { label: '🔥 Sekarang (2020+)', value: 'tahun 2020 hingga sekarang' },
];

// ─── Rotating Topics ───────────────────────────────────────────────────────────
const TOPIC_POOL = [
  'Pemain terbaik yang pernah bermain di Liga Spanyol',
  'Penyerang paling mematikan dalam sejarah sepak bola',
  'Kiper terbaik yang pernah ada dalam sejarah sepak bola',
  'Pemain dengan kemampuan dribbling paling memukau',
  'Pemain dengan eksekusi tendangan bebas paling akurat',
  'Bek tengah paling ditakuti striker lawan',
  'Gelandang pengangkut air paling tangguh di lapangan',
  'Pemain legendaris yang tidak pernah meraih Ballon d\'Or',
  'Striker paling produktif dalam satu musim kompetisi',
  'Pemain muda paling berbakat yang diprediksi jadi bintang dunia',
  'Pemain dengan sprint paling cepat di dunia sepak bola',
  'Kapten tim nasional paling karismatik sepanjang masa',
  'Pemain berkaki kidal terbaik dalam sejarah sepak bola',
  'Pemain sepak bola asal Asia paling sukses di benua Eropa',
  'Pemain terbaik yang pernah bermain di Serie A Italia',
  'Pemain legendaris yang pernah membela timnas Brasil',
  'Pemain sepak bola dengan selebrasi gol paling khas',
  'Playmaker jenius dengan visi umpan terbaik',
  'Pemain yang paling sering memenangkan gelar Liga Champions',
  'Pemain sepak bola dengan tendangan paling keras',
];

const DISPLAY_COUNT = 6;
const STORAGE_KEY = 'survey-topic-display';

function getRotatingTopics(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const shuffled = [...TOPIC_POOL].sort(() => Math.random() - 0.5);
      const topics = shuffled.slice(0, DISPLAY_COUNT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
      return topics;
    }
    const current: string[] = JSON.parse(stored);
    const notShown = TOPIC_POOL.filter((t) => !current.includes(t));
    if (notShown.length === 0) return current;
    const swapCount = Math.floor(Math.random() * 2) + 1;
    const newTopics = [...current];
    for (let i = 0; i < Math.min(swapCount, notShown.length); i++) {
      const replaceIdx = Math.floor(Math.random() * DISPLAY_COUNT);
      const newIdx = Math.floor(Math.random() * notShown.length);
      newTopics[replaceIdx] = notShown[newIdx];
      notShown.splice(newIdx, 1);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTopics));
    return newTopics;
  } catch {
    return TOPIC_POOL.slice(0, DISPLAY_COUNT);
  }
}

// ─── Default custom rows ───────────────────────────────────────────────────────
const DEFAULT_ROWS = () => [
  { answer: '', aliases: '', points: 35 },
  { answer: '', aliases: '', points: 25 },
  { answer: '', aliases: '', points: 20 },
  { answer: '', aliases: '', points: 12 },
  { answer: '', aliases: '', points: 8 },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function QuestionSetupModal({ onStart }: QuestionSetupModalProps) {
  const [gameMode, setGameMode] = useState<'1player' | '2player'>('2player');
  const [tab, setTab] = useState<'ai' | 'custom'>('ai');
  const [topic, setTopic] = useState('');
  const [selectedEra, setSelectedEra] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [error, setError] = useState('');
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [displayTopics, setDisplayTopics] = useState<string[]>([]);

  useEffect(() => {
    setDisplayTopics(getRotatingTopics());
  }, []);

  const handleSuggestTopic = async () => {
    setSuggestLoading(true);
    setError('');
    try {
      const res = await fetch('/api/groq/suggest-topic');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTopic(data.topic);
    } catch {
      setError('Gagal generate topik. Coba lagi.');
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleAIGenerate = async (topicText: string) => {
    if (!topicText.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/groq/generate-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicText, era: selectedEra || undefined }),
      });
      if (!res.ok) throw new Error('Gagal generate pertanyaan');
      const data = await res.json();
      onStart(data.question, data.answers, 'ai_generated', p1Name, p2Name, gameMode);
    } catch {
      setError('Gagal terhubung ke AI. Pastikan GROQ_API_KEY sudah diset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg space-y-4"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
            <Sparkles size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Family 100</h1>
          <p className="mt-1 text-sm text-slate-400">Tebak jawaban survey bertema sepak bola</p>
        </div>

        {/* ── Mode Selector ──────────────────────────────────────────── */}
        <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mode Bermain</p>
          <div className="grid grid-cols-2 gap-2">
            <ModeButton
              active={gameMode === '1player'}
              onClick={() => setGameMode('1player')}
              icon={<User size={18} />}
              label="1 Pemain"
              sub="Solo, 3 nyawa"
              color="emerald"
            />
            <ModeButton
              active={gameMode === '2player'}
              onClick={() => setGameMode('2player')}
              icon={<Users size={18} />}
              label="2 Pemain"
              sub="Bergantian, 30 detik"
              color="blue"
            />
          </div>
        </div>

        {/* ── Player Names ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {gameMode === '2player' ? (
            <motion.div
              key="2p-names"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-slate-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Pemain</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-blue-400 font-medium">🔵 Pemain 1</label>
                    <input
                      type="text"
                      value={p1Name}
                      onChange={(e) => setP1Name(e.target.value)}
                      placeholder="Nama kamu"
                      maxLength={20}
                      className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-red-400 font-medium">🔴 Pemain 2</label>
                    <input
                      type="text"
                      value={p2Name}
                      onChange={(e) => setP2Name(e.target.value)}
                      placeholder="Nama lawan"
                      maxLength={20}
                      className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-red-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="1p-name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <User size={13} className="text-slate-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Kamu</p>
                </div>
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  placeholder="Masukkan nama kamu"
                  maxLength={20}
                  className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content Tab ────────────────────────────────────────────── */}
        <div className="flex rounded-xl bg-slate-800/60 p-1">
          <button
            onClick={() => setTab('ai')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === 'ai' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            Generate AI
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === 'custom' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenLine size={14} />
            Buat Sendiri
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'ai' ? (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Topic input */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Topik Pertanyaan</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate(topic)}
                      placeholder="Tulis topik atau klik Surprise..."
                      className="w-full rounded-xl bg-slate-800 px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-emerald-500/50 transition-all"
                    />
                    {topic && (
                      <button
                        onClick={() => setTopic('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="amber"
                    size="md"
                    loading={suggestLoading}
                    onClick={handleSuggestTopic}
                    title="AI suggest random topic"
                  >
                    <Dice6 size={16} />
                    <span className="hidden sm:inline">Surprise!</span>
                  </Button>
                </div>
              </div>

              {/* ── Era Filter ──────────────────────────────────────── */}
              <div className="rounded-xl bg-slate-800/50 p-3 ring-1 ring-white/8 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-amber-400" />
                  <p className="text-xs font-semibold text-slate-400">Filter Era Pemain</p>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {ERA_OPTIONS.map((era) => (
                    <button
                      key={era.value}
                      onClick={() => setSelectedEra(era.value)}
                      className={`rounded-lg px-2 py-1.5 text-[11px] font-medium text-center transition-all leading-tight ${
                        selectedEra === era.value
                          ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/40'
                          : 'bg-slate-900/60 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {era.label}
                    </button>
                  ))}
                </div>
                {selectedEra && (
                  <p className="text-[10px] text-amber-400/70 pl-0.5">
                    AI akan fokus pada: <span className="font-medium">{selectedEra}</span>
                  </p>
                )}
              </div>

              {/* Popular topics */}
              {displayTopics.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Topik Populer</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {displayTopics.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTopic(t)}
                        className={`rounded-lg px-3 py-2 text-left text-xs transition-all ${
                          topic === t
                            ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
                  {error}
                </div>
              )}

              <Button
                fullWidth
                size="lg"
                loading={loading}
                disabled={!topic.trim()}
                onClick={() => handleAIGenerate(topic)}
              >
                {loading ? 'Generating...' : (
                  <>
                    <Sparkles size={16} />
                    Generate & Mulai Game
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="custom"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <CustomInputForm
                onStart={(q, a, s) => onStart(q, a, s, p1Name, p2Name, gameMode)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Mode Button ──────────────────────────────────────────────────────────────
function ModeButton({
  active,
  onClick,
  icon,
  label,
  sub,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: 'emerald' | 'blue';
}) {
  const activeClass =
    color === 'emerald'
      ? 'bg-emerald-500/20 ring-emerald-500/40 text-emerald-400'
      : 'bg-blue-500/20 ring-blue-500/40 text-blue-400';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 ring-1 transition-all ${
        active ? activeClass : 'bg-slate-900/60 ring-white/5 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
      }`}
    >
      {icon}
      <span className="text-sm font-bold">{label}</span>
      <span className="text-[10px] opacity-70">{sub}</span>
    </button>
  );
}

// ─── Custom Form ──────────────────────────────────────────────────────────────
interface CustomRow {
  answer: string;
  aliases: string;
  points: number;
}

function CustomInputForm({
  onStart,
}: {
  onStart: (q: string, a: SurveyAnswer[], s: 'custom_input') => void;
}) {
  const [question, setQuestion] = useState('');
  const [rows, setRows] = useState<CustomRow[]>(DEFAULT_ROWS());
  const [error, setError] = useState('');

  const totalPoints = rows.reduce((s, r) => s + (Number(r.points) || 0), 0);

  const addRow = () => {
    if (rows.length >= 10) return;
    setRows((prev) => [...prev, { answer: '', aliases: '', points: 0 }]);
  };

  const removeRow = (i: number) => {
    if (rows.length <= 5) return;
    setRows((prev) => prev.filter((_, j) => j !== i));
  };

  const updateRow = (i: number, field: keyof CustomRow, value: string | number) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = () => {
    if (!question.trim()) { setError('Pertanyaan harus diisi'); return; }
    if (rows.some((r) => !r.answer.trim())) { setError('Semua jawaban harus diisi'); return; }
    if (totalPoints !== 100) { setError(`Total poin harus 100 (sekarang: ${totalPoints})`); return; }
    setError('');
    const parsed: SurveyAnswer[] = rows.map((r, i) => ({
      id: String(i),
      answer: r.answer.trim(),
      aliases: r.aliases.split(',').map((s) => s.trim()).filter(Boolean),
      points: Number(r.points),
      isRevealed: false,
    }));
    onStart(question.trim(), parsed, 'custom_input');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">Pertanyaan</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Tulis pertanyaan survey..."
          className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-emerald-500/50"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Jawaban ({rows.length}/10)</p>
          <span className={`text-xs font-mono ${totalPoints === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {totalPoints}/100 poin
          </span>
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 90px 48px 24px' }}>
          <span className="text-[10px] text-slate-600 pl-1">Jawaban</span>
          <span className="text-[10px] text-slate-600 pl-1">Alias (koma)</span>
          <span className="text-[10px] text-slate-600 text-center">Poin</span>
          <span />
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {rows.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-2 items-center"
              style={{ gridTemplateColumns: '1fr 90px 48px 24px' }}
            >
              <input
                type="text"
                value={row.answer}
                onChange={(e) => updateRow(i, 'answer', e.target.value)}
                placeholder={`Jawaban ${i + 1}`}
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-emerald-500/50"
              />
              <input
                type="text"
                value={row.aliases}
                onChange={(e) => updateRow(i, 'aliases', e.target.value)}
                placeholder="alias..."
                className="rounded-lg bg-slate-800 px-2 py-2 text-xs text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-emerald-500/50"
              />
              <input
                type="number"
                value={row.points}
                onChange={(e) => updateRow(i, 'points', Number(e.target.value))}
                min={1}
                max={100}
                className="rounded-lg bg-slate-800 px-2 py-2 text-center text-xs font-mono text-amber-400 outline-none ring-1 ring-white/10 focus:ring-amber-500/50"
              />
              <button
                onClick={() => removeRow(i)}
                disabled={rows.length <= 5}
                className="flex items-center justify-center text-slate-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>

        {rows.length < 10 && (
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-400 transition-colors mt-1"
          >
            <Plus size={12} />
            Tambah jawaban ({rows.length}/10)
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button
        fullWidth
        size="lg"
        onClick={handleSubmit}
        disabled={totalPoints !== 100 || !question.trim()}
      >
        <PenLine size={16} />
        Mulai Game
      </Button>
    </div>
  );
}
