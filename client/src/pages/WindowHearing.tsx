/**
 * Window 5: HEARING — click sends audio pulse; body orients when coupled.
 */

import { useEffect, useRef } from 'react';
import { useSharedStateWindow } from '@/hooks/useSharedStateWindow';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import type { SharedState } from '@/lib/sharedState';

interface Ripple {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

export default function WindowHearing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state: sharedState, manager: stateManager } = useSharedStateWindow('hearing');
  useDesktopPointerBroadcast(stateManager);
  const sharedStateRef = useRef<SharedState>(sharedState);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number | null>(null);

  sharedStateRef.current = sharedState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(1, rect.width);
      const y = (e.clientY - rect.top) / Math.max(1, rect.height);
      ripplesRef.current.push({ x, y, r: 0.01, alpha: 1 });
      stateManager.updateSignal('soundPulse', { x, y, strength: 1, timestamp: Date.now() });
    };

    canvas.addEventListener('click', onClick);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#180810');
      grad.addColorStop(1, '#0a0818');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ripplesRef.current = ripplesRef.current
        .map((r) => ({ ...r, r: r.r + 0.008, alpha: r.alpha - 0.012 }))
        .filter((r) => r.alpha > 0);

      ripplesRef.current.forEach((r) => {
        const px = r.x * w;
        const py = r.y * h;
        const radius = r.r * Math.min(w, h);
        ctx.strokeStyle = `rgba(255, 179, 71, ${r.alpha * 0.85})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stateManager]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#02040a] text-amber-50">
      <header className="shrink-0 border-b border-amber-300/25 bg-[#030914]/92 px-6 py-4">
        <div className="text-xs uppercase tracking-[0.45em] text-amber-300/70">Audio Subsystem</div>
        <h1 className="text-3xl font-black tracking-[0.18em] text-white">HEARING</h1>
        <p className="mt-1 text-sm text-amber-100/65">
          Sound beyond the tab edge. With Memory open, helps the body nudge the window when the cursor is out of reach.
        </p>
      </header>
      <canvas ref={canvasRef} className="min-h-0 flex-1 w-full cursor-pointer" />
      <footer className="shrink-0 border-t border-amber-300/20 bg-[#030914]/95 p-3 font-mono text-[11px] text-amber-50/75">
        Emotion: {sharedState.creature.emotionalState} · Coupling {Math.round(sharedState.consciousness.coupling * 100)}%
      </footer>
    </div>
  );
}
