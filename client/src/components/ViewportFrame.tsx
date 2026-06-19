import type { ReactNode } from 'react';

export function ViewportFrame({
  children,
  accent = 'cyan',
  label = 'SENSOR FEED',
}: {
  children: ReactNode;
  accent?: string;
  label?: string;
}) {
  const corner =
    accent === 'sky'
      ? 'border-sky-400/40'
      : accent === 'emerald'
        ? 'border-emerald-400/40'
        : accent === 'fuchsia'
          ? 'border-fuchsia-400/40'
          : accent === 'amber'
            ? 'border-amber-400/40'
            : accent === 'pink'
              ? 'border-pink-400/40'
              : 'border-cyan-400/40';

  return (
    <div className="relative mx-4 mb-4 mt-1 min-h-0 flex-1">
      <div className={`absolute inset-0 rounded-sm border ${corner} opacity-30`} />
      {/* HUD corners */}
      <span className={`absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 ${corner}`} />
      <span className={`absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 ${corner}`} />
      <span className={`absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 ${corner}`} />
      <span className={`absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 ${corner}`} />

      <div className="absolute left-3 top-2 z-20 font-mono text-[9px] uppercase tracking-[0.35em] text-slate-500">
        {label}
      </div>
      <div className="absolute right-3 top-2 z-20 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 immersion-pulse" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/80">Live</span>
      </div>

      <div className="immersion-scanline pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-sm opacity-[0.07]" />

      <div className="relative h-full overflow-hidden rounded-sm bg-black/40">{children}</div>
    </div>
  );
}
