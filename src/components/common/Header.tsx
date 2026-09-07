'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, Home } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all group-hover:shadow-emerald-500/50">
            <Trophy size={16} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">
            Football<span className="text-emerald-400">AI</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <NavLink href="/" icon={<Home size={14} />} label="Home" active={pathname === '/'} />
          <NavLink
            href="/game/family-survey"
            icon={<Trophy size={14} />}
            label="Family 100"
            active={pathname === '/game/family-survey'}
          />
          <NavLink
            href="/game/draft-auction"
            icon={<Users size={14} />}
            label="Draft 1v1"
            active={pathname === '/game/draft-auction'}
          />
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
