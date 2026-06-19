/**
 * Launcher — open subsystem windows; overlap them on the desktop to link consciousness.
 */

import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import { getSharedState } from '@/lib/sharedState';

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
  const pointerHubRef = useRef(getSharedState());
  useDesktopPointerBroadcast(pointerHubRef.current);

  const openWindow = (windowId: string, left = 120, top = 90, width = 720, height = 520) => {
    const target = windows.find((item) => item.id === windowId);
    if (!target) return;

    window.open(
      target.path,
      `fragmented-${target.id}-${Date.now()}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no`,
    );
    setOpenedWindows((prev) => new Set(Array.from(prev).concat(windowId)));
  };

  const openDemo = () => {
    openWindow('body', 80, 60, 900, 640);
    setTimeout(() => openWindow('vision', 820, 60, 720, 520), 300);
    setTimeout(() => openWindow('memory', 80, 600, 480, 380), 600);
  };

  const openAllWindows = () => {
    windows.forEach((item, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      setTimeout(() => openWindow(item.id, 60 + col * 640, 50 + row * 400, 620, 380), index * 200);
    });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#04060f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(22,244,255,0.09),transparent_50%),radial-gradient(ellipse_at_85%_100%,rgba(139,92,246,0.12),transparent_45%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[10px] font-medium uppercase tracking-[0.6em] text-cyan-300/80">Distributed Cognition</div>
            <h1 className="mt-4 bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-5xl font-black tracking-[0.06em] text-transparent md:text-6xl">
              FRAGMENTED CONSCIOUSNESS
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300/80">
              Open all <strong className="text-white">six panes</strong> for full pursuit and capture. Your mouse on
              this launcher steers the body too. At the edge of its world it <strong className="text-cyan-200">pushes
              the window toward you</strong>, then lunges when your cursor enters the pane.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button
              onClick={() => openWindow('body', 100, 80, 900, 640)}
              className="rounded-2xl bg-gradient-to-br from-cyan-500/25 to-cyan-600/10 px-7 py-6 font-bold uppercase tracking-[0.16em] text-white ring-1 ring-cyan-400/30 hover:from-cyan-500/35"
            >
              Open Body
            </Button>
            <Button
              onClick={openDemo}
              className="rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/10 px-7 py-6 font-bold uppercase tracking-[0.16em] text-fuchsia-50 ring-1 ring-fuchsia-400/25 hover:from-fuchsia-500/30"
            >
              3-Window Demo
            </Button>
            <Button
              onClick={openAllWindows}
              className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 px-7 py-6 font-bold uppercase tracking-[0.16em] text-emerald-50 ring-1 ring-emerald-400/25 hover:from-emerald-500/30"
            >
              Open All Panes
            </Button>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-4">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {windows.map((item, index) => (
            <section
              key={item.id}
              className={`rounded-2xl bg-gradient-to-br p-6 ring-1 ring-inset backdrop-blur-md transition ${accentCard[item.accent]}`}
            >
              <div className="text-[10px] uppercase tracking-[0.42em] text-slate-400">{item.role}</div>
              <h2 className="mt-2 text-3xl font-black tracking-[0.18em] text-white">{item.name}</h2>
              <p className="mt-3 min-h-16 text-sm leading-6 text-slate-300/70">{item.description}</p>
              <Button
                onClick={() => openWindow(item.id, 100 + index * 40, 80 + index * 30, 720, 520)}
                className="mt-5 rounded-xl bg-white/[0.06] px-4 py-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-100 ring-1 ring-white/10 hover:bg-white/[0.12]"
              >
                Open Pane
              </Button>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-white/[0.03] p-6 text-sm leading-7 text-slate-300/80 ring-1 ring-white/10 backdrop-blur-md">
          <h3 className="font-bold uppercase tracking-[0.28em] text-cyan-200/90">How to use</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Use <strong>Open All Panes</strong> — partial setups (3/6) stay slow and confused.
            </li>
            <li>
              Move your mouse on the launcher or any pane — the body tracks globally once <strong>Vision</strong> is open.
            </li>
            <li>
              When your cursor is outside the Body window, it runs to the edge and pushes the tab toward you.
            </li>
            <li>Once your cursor enters the Body pane, it lunges to capture (needs Touch + 6/6).</li>
          </ol>
          {openedWindows.size > 0 && (
            <p className="mt-4 text-cyan-300/70">Opened this session: {Array.from(openedWindows).join(', ')}</p>
          )}
        </section>
      </main>
    </div>
  );
}
