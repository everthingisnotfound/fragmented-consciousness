import { useEffect, useState, type ReactNode } from 'react';
import { ConsciousnessRail } from '@/components/ConsciousnessRail';
import type { WindowType } from '@/lib/sharedState';

export type Accent = 'cyan' | 'sky' | 'emerald' | 'fuchsia' | 'amber' | 'pink';

const accentMap: Record<
  Accent,
  { text: string; chip: string; gradient: string; glow: string; hex: string }
> = {
  cyan: {
    text: 'text-cyan-300',
    chip: 'bg-cyan-500/10 text-cyan-100 ring-cyan-400/25',
    gradient: 'from-cyan-500/25 via-violet-600/5 to-transparent',
    glow: 'rgba(34,211,238,0.15)',
    hex: '#22d3ee',
  },
  sky: {
    text: 'text-sky-300',
    chip: 'bg-sky-500/10 text-sky-100 ring-sky-400/25',
    gradient: 'from-sky-500/25 via-indigo-600/5 to-transparent',
    glow: 'rgba(56,189,248,0.15)',
    hex: '#38bdf8',
  },
  emerald: {
    text: 'text-emerald-300',
    chip: 'bg-emerald-500/10 text-emerald-100 ring-emerald-400/25',
    gradient: 'from-emerald-500/25 via-teal-600/5 to-transparent',
    glow: 'rgba(52,211,153,0.15)',
    hex: '#34d399',
  },
  fuchsia: {
    text: 'text-fuchsia-300',
    chip: 'bg-fuchsia-500/10 text-fuchsia-100 ring-fuchsia-400/25',
    gradient: 'from-fuchsia-500/25 via-violet-600/5 to-transparent',
    glow: 'rgba(232,121,249,0.15)',
    hex: '#e879f9',
  },
  amber: {
    text: 'text-amber-300',
    chip: 'bg-amber-500/10 text-amber-100 ring-amber-400/25',
    gradient: 'from-amber-500/25 via-orange-600/5 to-transparent',
    glow: 'rgba(251,191,36,0.15)',
    hex: '#fbbf24',
  },
  pink: {
    text: 'text-pink-300',
    chip: 'bg-pink-500/10 text-pink-100 ring-pink-400/25',
    gradient: 'from-pink-500/25 via-rose-600/5 to-transparent',
    glow: 'rgba(244,114,182,0.15)',
    hex: '#f472b6',
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
  consciousnessLevel?: number;
  activeWindows?: WindowType[];
  frameLabel?: string;
  /** When true, children are wrapped in ViewportFrame by caller or use raw main */
  viewport?: boolean;
}

function LiveClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setT(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${Math.floor(d.getMilliseconds() / 100)}`,
      );
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-[10px] tabular-nums text-slate-500">{t}</span>;
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
  consciousnessLevel = 0,
  activeWindows = [],
}: SubsystemShellProps) {
  const a = accentMap[accent];

  return (
    <div className="immersion-root relative flex h-screen w-full flex-col overflow-hidden bg-[#030508] text-slate-100">
      {/* Atmospheric layers */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${a.glow}, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(139,92,246,0.12), transparent 50%)`,
        }}
      />
      <div className="immersion-noise pointer-events-none absolute inset-0 opacity-[0.035]" />
      <div className="immersion-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030508_85%)]" />

      {/* Header HUD */}
      <header className="relative z-20 shrink-0 border-b border-white/[0.06] px-5 py-4 backdrop-blur-md">
        <div className={`absolute inset-0 bg-gradient-to-r ${a.gradient} opacity-80`} />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`font-mono text-[10px] font-medium uppercase tracking-[0.55em] ${a.text}`}>
                ◈ {role}
              </span>
              <LiveClock />
            </div>
            <h1 className="mt-1.5 text-3xl font-black uppercase tracking-[0.22em] text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.08)]">
              {title}
            </h1>
            {description && (
              <div className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</div>
            )}
            {badges && <div className="mt-3 flex flex-wrap gap-2">{badges}</div>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {headerRight}
            <ConsciousnessRail active={activeWindows} level={consciousnessLevel} accent={accent} compact />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</main>

      {footer && (
        <footer className="relative z-20 shrink-0 border-t border-white/[0.06] bg-black/50 px-5 py-2.5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-mono text-[10px] text-slate-500">{footer}</div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-slate-600">
              <span className="immersion-pulse h-1 w-1 rounded-full bg-cyan-400" />
              Sync channel active
            </div>
          </div>
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
    <div className={`rounded-lg px-4 py-2 text-center ring-1 ring-inset backdrop-blur-sm ${a.chip}`}>
      <div className="text-xl font-black tabular-nums tracking-tight">{value}</div>
      <div className="text-[8px] uppercase tracking-[0.32em] opacity-60">{label}</div>
    </div>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' | 'ok' }) {
  const tones = {
    neutral: 'bg-white/[0.04] text-slate-300 ring-white/10',
    warn: 'bg-rose-500/10 text-rose-200 ring-rose-400/20',
    ok: 'bg-emerald-500/10 text-emerald-200 ring-emerald-400/20',
  };
  return (
    <span
      className={`rounded-md px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export { accentMap };
