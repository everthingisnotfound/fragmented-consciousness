import type { ReactNode } from 'react';

type Accent = 'cyan' | 'sky' | 'emerald' | 'fuchsia' | 'amber' | 'pink';

const accentMap: Record<
  Accent,
  { glow: string; text: string; chip: string; gradient: string }
> = {
  cyan: {
    glow: 'shadow-[0_0_40px_rgba(22,244,255,0.12)]',
    text: 'text-cyan-200',
    chip: 'bg-cyan-400/10 text-cyan-100 ring-cyan-300/30',
    gradient: 'from-cyan-500/20 via-transparent to-violet-600/10',
  },
  sky: {
    glow: 'shadow-[0_0_40px_rgba(56,189,248,0.12)]',
    text: 'text-sky-200',
    chip: 'bg-sky-400/10 text-sky-100 ring-sky-300/30',
    gradient: 'from-sky-500/20 via-transparent to-indigo-600/10',
  },
  emerald: {
    glow: 'shadow-[0_0_40px_rgba(52,211,153,0.12)]',
    text: 'text-emerald-200',
    chip: 'bg-emerald-400/10 text-emerald-100 ring-emerald-300/30',
    gradient: 'from-emerald-500/20 via-transparent to-teal-600/10',
  },
  fuchsia: {
    glow: 'shadow-[0_0_40px_rgba(232,121,249,0.12)]',
    text: 'text-fuchsia-200',
    chip: 'bg-fuchsia-400/10 text-fuchsia-100 ring-fuchsia-300/30',
    gradient: 'from-fuchsia-500/20 via-transparent to-violet-600/10',
  },
  amber: {
    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.12)]',
    text: 'text-amber-200',
    chip: 'bg-amber-400/10 text-amber-100 ring-amber-300/30',
    gradient: 'from-amber-500/20 via-transparent to-orange-600/10',
  },
  pink: {
    glow: 'shadow-[0_0_40px_rgba(244,114,182,0.12)]',
    text: 'text-pink-200',
    chip: 'bg-pink-400/10 text-pink-100 ring-pink-300/30',
    gradient: 'from-pink-500/20 via-transparent to-purple-600/10',
  },
};

interface SubsystemShellProps {
  accent?: Accent;
  role: string;
  title: string;
  description?: ReactNode;
  headerRight?: ReactNode;
  badges?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function SubsystemShell({
  accent = 'cyan',
  role,
  title,
  description,
  headerRight,
  badges,
  footer,
  children,
}: SubsystemShellProps) {
  const a = accentMap[accent];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#04060f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(22,244,255,0.08),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgba(139,92,246,0.1),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <header className={`relative z-10 shrink-0 px-6 py-5 backdrop-blur-xl ${a.glow}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-60`} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className={`text-[10px] font-medium uppercase tracking-[0.55em] ${a.text} opacity-80`}>
              {role}
            </div>
            <h1 className="mt-1 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-3xl font-black tracking-[0.2em] text-transparent">
              {title}
            </h1>
            {description && <div className="mt-2 text-sm leading-relaxed text-slate-300/75">{description}</div>}
            {badges && <div className="mt-3 flex flex-wrap gap-2">{badges}</div>}
          </div>
          {headerRight && <div className="relative flex flex-wrap items-center gap-2">{headerRight}</div>}
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1">{children}</main>

      {footer && (
        <footer className="relative z-10 shrink-0 border-t border-white/[0.06] bg-black/30 px-5 py-3 font-mono text-[11px] text-slate-400 backdrop-blur-md">
          {footer}
        </footer>
      )}
    </div>
  );
}

export function StatusChip({
  label,
  value,
  accent = 'cyan',
}: {
  label: string;
  value: ReactNode;
  accent?: Accent;
}) {
  const a = accentMap[accent];
  return (
    <div className={`rounded-xl px-4 py-2 text-center ring-1 ring-inset backdrop-blur-sm ${a.chip}`}>
      <div className="text-xl font-black tabular-nums">{value}</div>
      <div className="text-[9px] uppercase tracking-[0.28em] opacity-70">{label}</div>
    </div>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' | 'ok' }) {
  const tones = {
    neutral: 'bg-white/[0.06] text-slate-200 ring-white/10',
    warn: 'bg-rose-500/15 text-rose-100 ring-rose-400/25',
    ok: 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/25',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}
