/**
 * Window 6: EMOTION — mood aura synced across windows when coupled.
 */

import { useEffect, useRef } from 'react';
import { useSharedStateWindow } from '@/hooks/useSharedStateWindow';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import type { EmotionalState, SharedState } from '@/lib/sharedState';

const MOOD_COLORS: Record<EmotionalState, string> = {
  curious: '#16f4ff',
  happy: '#fff36a',
  fearful: '#9f5cff',
  excited: '#78ff6a',
  calm: '#6afff5',
};

export default function WindowEmotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state: sharedState, manager: stateManager } = useSharedStateWindow('emotion');
  useDesktopPointerBroadcast(stateManager);
  const sharedStateRef = useRef<SharedState>(sharedState);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

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

    const draw = () => {
      phaseRef.current += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      const state = sharedStateRef.current;
      const mood = state.creature.emotionalState;
      const color = MOOD_COLORS[mood];
      const energy = state.creature.energy / 100;
      const coupled = state.consciousness.coupledWindows.includes('body');

      ctx.fillStyle = '#080612';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const pulse = 0.5 + Math.sin(phaseRef.current) * 0.15;

      for (let i = 4; i >= 0; i -= 1) {
        const r = (0.15 + i * 0.08) * Math.min(w, h) * pulse * (coupled ? 1.1 : 0.85);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, color + '55');
        g.addColorStop(1, color + '00');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mood.toUpperCase(), cx, cy - 8);
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(`energy ${Math.round(energy * 100)}%`, cx, cy + 20);

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#02040a] text-pink-50">
      <header className="shrink-0 border-b border-pink-300/25 bg-[#030914]/92 px-6 py-4">
        <div className="text-xs uppercase tracking-[0.45em] text-pink-300/70">Affect Subsystem</div>
        <h1 className="text-3xl font-black tracking-[0.18em] text-white">EMOTION</h1>
        <p className="mt-1 text-sm text-pink-100/65">
          Motivation and speed. Missing Emotion leaves the body sluggish; jumps are weaker until this pane is open.
        </p>
      </header>
      <canvas ref={canvasRef} className="min-h-0 flex-1 w-full" />
      <footer className="shrink-0 border-t border-pink-300/20 bg-[#030914]/95 p-3 font-mono text-[11px] text-pink-50/75">
        {sharedState.consciousness.description} · {sharedState.consciousness.activeWindows.length} windows active
      </footer>
    </div>
  );
}
