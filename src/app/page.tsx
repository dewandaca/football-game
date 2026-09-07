import Link from 'next/link';
import { Trophy, Users, Zap, Shield, ArrowRight, Star } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Football AI Games — Beranda',
  description: 'Platform mini-game sepak bola interaktif berbasis AI Groq. Family 100 trivia & 1v1 Draft Auction.',
};

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute left-1/4 top-32 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute right-1/4 top-32 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            <Zap size={12} fill="currentColor" />
            Powered by Groq AI × GPT 120b
          </div>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Football{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              AI Games
            </span>
          </h1>

          <p className="mb-8 text-base text-slate-400 sm:text-lg max-w-xl mx-auto leading-relaxed">
            Dua mini-game sepak bola interaktif berbasis AI. Tebak survei, atau susun skuad 4-3-3 impianmu dengan budget terbatas!
          </p>

          {/* Stats */}
          <div className="mb-10 flex items-center justify-center gap-6">
            {[
              { label: 'Mode Game', value: '2' },
              { label: 'Posisi Draft', value: '11' },
              { label: 'AI Engine', value: 'Groq' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-mono text-2xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Cards */}
      <section className="px-4 pb-20">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          <GameCard
            href="/game/family-survey"
            icon={<Trophy size={28} />}
            iconBg="bg-emerald-500/20 text-emerald-400"
            iconGlow="shadow-emerald-500/20"
            badge="Family 100"
            badgeColor="bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
            title="Football Family 100"
            description="Tebak 5 jawaban survei bertema sepak bola sebelum 3 kali salah. Cocok untuk adu pengetahuan football bersama teman!"
            features={['AI-generated questions', 'Fuzzy matching', 'Flip card animations', 'Custom questions']}
            accentColor="emerald"
            cta="Main Sekarang"
          />

          <GameCard
            href="/game/draft-auction"
            icon={<Users size={28} />}
            iconBg="bg-blue-500/20 text-blue-400"
            iconGlow="shadow-blue-500/20"
            badge="1v1 Draft"
            badgeColor="bg-blue-500/15 text-blue-400 ring-blue-500/30"
            title="1v1 Split-Draft Auction"
            description="Bergantian draft 11 pemain format 4-3-3 dalam budget terbatas. Siapa yang bisa menyusun skuad paling tajam?"
            features={['11 ronde x 2 pemain AI', 'Formasi 4-3-3', 'Budget management', 'Mini-pitch visual']}
            accentColor="blue"
            cta="Mulai Draft"
          />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-xl font-bold text-white">Kenapa Football AI Games?</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: <Zap size={20} />,
                color: 'text-amber-400 bg-amber-500/10',
                title: 'Instan & Cepat',
                desc: 'AI generate pertanyaan dan draft pemain dalam hitungan detik via Groq.',
              },
              {
                icon: <Shield size={20} />,
                color: 'text-emerald-400 bg-emerald-500/10',
                title: 'Refresh-Safe',
                desc: 'Game state tersimpan di browser. Refresh halaman tidak akan mereset progress.',
              },
              {
                icon: <Star size={20} />,
                color: 'text-blue-400 bg-blue-500/10',
                title: 'Mobile-First',
                desc: 'Didesain untuk dimainkan di smartphone, nyaman di tangan kamu.',
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/5"
              >
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${feat.color}`}>
                  {feat.icon}
                </div>
                <h3 className="mb-1.5 font-semibold text-white">{feat.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function GameCard({
  href,
  icon,
  iconBg,
  badge,
  badgeColor,
  title,
  description,
  features,
  accentColor,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconGlow: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  features: string[];
  accentColor: 'emerald' | 'blue';
  cta: string;
}) {
  const hoverBorder = accentColor === 'emerald' ? 'hover:ring-emerald-500/30' : 'hover:ring-blue-500/30';
  const ctaClass =
    accentColor === 'emerald'
      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 hover:shadow-emerald-500/40'
      : 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/25 hover:shadow-blue-500/40';
  const dotColor = accentColor === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';

  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${hoverBorder}`}
    >
      {/* Glow effect */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          accentColor === 'emerald' ? 'bg-emerald-500/3' : 'bg-blue-500/3'
        }`}
      />

      {/* Badge & Icon */}
      <div className="relative mb-4 flex items-start justify-between">
        <div className={`rounded-2xl p-3 ${iconBg} ring-1 ring-white/10`}>{icon}</div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeColor}`}>
          {badge}
        </span>
      </div>

      {/* Content */}
      <h2 className="relative mb-2 text-xl font-bold text-white">{title}</h2>
      <p className="relative mb-4 text-sm text-slate-400 leading-relaxed flex-1">{description}</p>

      {/* Features */}
      <ul className="relative mb-5 space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div
        className={`relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold shadow-lg transition-all duration-200 ${ctaClass}`}
      >
        {cta}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
