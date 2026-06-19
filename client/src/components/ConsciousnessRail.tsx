import type { WindowType } from '@/lib/sharedState';

const NODES: { id: WindowType; label: string }[] = [
  { id: 'body', label: 'B' },
  { id: 'vision', label: 'V' },
  { id: 'memory', label: 'M' },
  { id: 'touch', label: 'T' },
  { id: 'hearing', label: 'H' },
  { id: 'emotion', label: 'E' },
];

const accentRing: Record<string, string> = {
  cyan: 'ring-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.35)]',
  sky: 'ring-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.35)]',
  emerald: 'ring-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.35)]',
  fuchsia: 'ring-fuchsia-400/50 shadow-[0_0_12px_rgba(232,121,249,0.35)]',
  amber: 'ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.35)]',
  pink: 'ring-pink-400/50 shadow-[0_0_12px_rgba(244,114,182,0.35)]',
};

export function ConsciousnessRail({
  active,
  level,
  accent = 'cyan',
  compact = false,
}: {
  active: WindowType[];
  level: number;
  accent?: string;
  compact?: boolean;
}) {
  const activeSet = new Set(active);
  const ring = accentRing[accent] ?? accentRing.cyan;

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'w-full'}`}>
      {!compact && (
        <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Neural link</span>
      )}
      <div className="flex items-center gap-1">
        {NODES.map((node, i) => {
          const on = activeSet.has(node.id);
          return (
            <div key={node.id} className="flex items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[9px] font-bold transition-all duration-500 ${
                  on
                    ? `bg-white/10 text-white ring-1 ${ring} immersion-pulse`
                    : 'bg-white/[0.02] text-slate-600 ring-1 ring-white/5'
                }`}
                title={node.id}
              >
                {node.label}
              </div>
              {i < NODES.length - 1 && (
                <div
                  className={`h-px w-2 sm:w-3 transition-colors duration-500 ${
                    on && activeSet.has(NODES[i + 1].id) ? 'bg-cyan-400/40' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <span className="ml-1 font-mono text-[10px] tabular-nums text-slate-400">
        {level}<span className="text-slate-600">/6</span>
      </span>
    </div>
  );
}
