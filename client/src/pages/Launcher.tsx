/**
 * Launcher — open subsystem windows; overlap them on the desktop to link consciousness.
 */

import { Button } from '@/components/ui/button';
import { ConsciousnessRail } from '@/components/ConsciousnessRail';
import { useSharedStateSnapshot } from '@/hooks/useSharedStateSnapshot';
import { useRef, useState } from 'react';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import { getSharedState } from '@/lib/sharedState';
import type { WindowType } from '@/lib/sharedState';

interface CognitiveWindow {
  id: string;
  name: string;
  role: string;
  description: string;
  path: string;
  accent: string;
}

const windows: CognitiveWindow[] = [
  {
    id: 'body',
    name: 'BODY',
    role: 'Somatic Core',
    description: '3D humanoid — follows your mouse or hand. Start here.',
    path: '/window/body',
    accent: 'cyan',
  },
  {
    id: 'vision',
    name: 'VISION',
    role: 'Optic Pane',
    description: 'Perception rays — overlap Body to steer the figure via sight.',
    path: '/window/vision',
    accent: 'sky',
  },
  {
    id: 'memory',
    name: 'MEMORY',
    role: 'Recall Pane',
    description: 'Path trails and danger zones the body learns to avoid.',
    path: '/window/memory',
    accent: 'emerald',
  },
  {
    id: 'touch',
    name: 'TOUCH',
    role: 'Haptic Pane',
    description: 'Click to send haptic pulses — body flinches when coupled.',
    path: '/window/touch',
    accent: 'fuchsia',
  },
  {
    id: 'hearing',
    name: 'HEARING',
    role: 'Audio Pane',
    description: 'Click for sound ripples — body turns toward them when linked.',
    path: '/window/hearing',
    accent: 'amber',
  },
  {
    id: 'emotion',
    name: 'EMOTION',
    role: 'Affect Pane',
    description: 'Mood aura tints the humanoid when overlapped with Body.',
    path: '/window/emotion',
    accent: 'pink',
  },
];

const accentCard: Record<string, string> = {
  cyan: 'from-cyan-500/15 to-transparent ring-cyan-400/20 hover:ring-cyan-400/40',
  sky: 'from-sky-500/15 to-transparent ring-sky-400/20 hover:ring-sky-400/40',
  emerald: 'from-emerald-500/15 to-transparent ring-emerald-400/20 hover:ring-emerald-400/40',
  fuchsia: 'from-fuchsia-500/15 to-transparent ring-fuchsia-400/20 hover:ring-fuchsia-400/40',
  amber: 'from-amber-500/15 to-transparent ring-amber-400/20 hover:ring-amber-400/40',
  pink: 'from-pink-500/15 to-transparent ring-pink-400/20 hover:ring-pink-400/40',
};

export default function Launcher() {
  const [openedWindows, setOpenedWindows] = useState<Set<string>>(new Set());
  const [blockedCount, setBlockedCount] = useState(0);
  const pointerHubRef = useRef(getSharedState());
  useDesktopPointerBroadcast(pointerHubRef.current);
  const live = useSharedStateSnapshot();
  const activeSet = new Set(live.consciousness.activeWindows);

  const openWindow = (windowId: string, left = 120, top = 90, width = 720, height = 520): boolean => {
    const target = windows.find((item) => item.id === windowId);
    if (!target) return false;

    const popup = window.open(
      target.path,
      `fragmented-${target.id}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no`,
    );

    if (!popup || popup.closed) {
      setBlockedCount((n) => n + 1);
      return false;
    }

    setOpenedWindows((prev) => new Set(Array.from(prev).concat(windowId)));
    setBlockedCount(0);
    return true;
  };

  const openMany = (items: Array<{ id: string; left: number; top: number; width: number; height: number }>) => {
    let opened = 0;
    let blocked = 0;
    const next = new Set(openedWindows);

    // Must run synchronously inside the click handler — setTimeout loses user-gesture trust.
    for (const item of items) {
      const target = windows.find((w) => w.id === item.id);
      if (!target) continue;
      const popup = window.open(
        target.path,
        `fragmented-${item.id}`,
        `width=${item.width},height=${item.height},left=${item.left},top=${item.top},menubar=no,toolbar=no,location=no`,
      );
      if (!popup || popup.closed) {
        blocked += 1;
      } else {
        opened += 1;
        next.add(item.id);
      }
    }

    setOpenedWindows(next);
    setBlockedCount(blocked);
    return { opened, blocked };
  };

  const openDemo = () => {
    openMany([
      { id: 'body', left: 80, top: 60, width: 900, height: 640 },
      { id: 'vision', left: 820, top: 60, width: 720, height: 520 },
      { id: 'memory', left: 80, top: 600, width: 480, height: 380 },
    ]);
  };

  const openAllWindows = () => {
    openMany(
      windows.map((item, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        return { id: item.id, left: 60 + col * 640, top: 50 + row * 400, width: 620, height: 380 };
      }),
    );
  };

  return (
    <div className="immersion-root relative min-h-screen overflow-hidden bg-[#030508] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_80%,rgba(139,92,246,0.14),transparent_50%)]" />
      <div className="immersion-noise pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="immersion-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030508_75%)]" />

      {/* Hero */}
      <div className="relative z-10 border-b border-white/[0.06] px-6 py-10 backdrop-blur-sm lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.65em] text-cyan-400/80">◈ Distributed cognition protocol</p>
            <h1 className="immersion-hero-glow mt-3 text-4xl font-black uppercase tracking-[0.08em] text-white md:text-6xl">
              Fragmented
              <span className="block bg-gradient-to-r from-cyan-300 via-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
                Consciousness
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
              One mind, six windows. Each pane is a sense — open them all and the body wakes up. Your cursor on this
              page <strong className="text-slate-200">feeds the nervous system</strong> in real time.
            </p>
            <div className="mt-6 rounded-lg border border-white/[0.06] bg-black/40 px-4 py-3 backdrop-blur-md">
              <ConsciousnessRail
                active={live.consciousness.activeWindows}
                level={live.consciousness.level}
                accent="cyan"
              />
              <p className="mt-2 font-mono text-[10px] text-slate-500">
                Status: <span className="text-cyan-300/90">{live.consciousness.description}</span>
                {live.consciousness.level > 0 && (
                  <span className="text-slate-600"> · Arrangement {live.consciousness.arrangement}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => openWindow('body', 100, 80, 900, 640)}
                className="rounded-lg bg-cyan-500/15 px-7 py-6 font-mono text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 ring-1 ring-cyan-400/30 hover:bg-cyan-500/25"
              >
                ◈ Open Body
              </Button>
              <Button
                onClick={openDemo}
                className="rounded-lg bg-fuchsia-500/10 px-7 py-6 font-mono text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-100 ring-1 ring-fuchsia-400/25 hover:bg-fuchsia-500/20"
              >
                3-Window Demo
              </Button>
              <Button
                onClick={openAllWindows}
                className="rounded-lg bg-emerald-500/10 px-7 py-6 font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-100 ring-1 ring-emerald-400/25 hover:bg-emerald-500/20"
              >
                Open All Panes
              </Button>
            </div>
            {blockedCount > 0 && (
              <div className="max-w-md rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <strong>Popups blocked ({blockedCount}).</strong> Allow popups for this site, then retry — or use{' '}
                <strong>Open tab ↗</strong> on each card.
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-8 lg:px-10">
        <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.4em] text-slate-600">Subsystem matrix</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {windows.map((item, index) => {
            const online = activeSet.has(item.id as WindowType);
            return (
              <section
                key={item.id}
                className={`group relative overflow-hidden rounded-lg border p-5 backdrop-blur-md transition-all duration-500 ${
                  online
                    ? `${accentCard[item.accent]} immersion-pulse border-white/10 bg-white/[0.04]`
                    : `${accentCard[item.accent]} border-white/[0.04] bg-black/30 opacity-80 hover:opacity-100`
                }`}
              >
                {online && (
                  <div className="absolute right-3 top-3 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 immersion-pulse" />
                    Online
                  </div>
                )}
                <div className="font-mono text-[9px] uppercase tracking-[0.45em] text-slate-500">{item.role}</div>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.2em] text-white">{item.name}</h2>
                <p className="mt-2 min-h-14 text-sm leading-relaxed text-slate-400">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => openWindow(item.id, 100 + index * 40, 80 + index * 30, 720, 520)}
                    className="rounded-md bg-white/[0.06] px-4 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-100 ring-1 ring-white/10 hover:bg-white/[0.12]"
                  >
                    Open pane
                  </Button>
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md bg-white/[0.03] px-4 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 ring-1 ring-white/8 hover:bg-white/[0.08]"
                  >
                    Open tab ↗
                  </a>
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-10 rounded-lg border border-white/[0.06] bg-black/40 p-6 backdrop-blur-md">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-400/80">Boot sequence</h3>
          <ol className="mt-4 space-y-2 font-mono text-xs text-slate-400">
            <li><span className="text-cyan-500/70">01</span> — Open all six panes (popups or tabs)</li>
            <li><span className="text-cyan-500/70">02</span> — Watch the neural link fill in above</li>
            <li><span className="text-cyan-500/70">03</span> — Move mouse anywhere; Body chases once Vision is online</li>
            <li><span className="text-cyan-500/70">04</span> — At 6/6 the body can push its window and grab your cursor</li>
          </ol>
          {openedWindows.size > 0 && (
            <p className="mt-4 font-mono text-[10px] text-cyan-400/70">
              Popups this session: {Array.from(openedWindows).join(', ')}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
