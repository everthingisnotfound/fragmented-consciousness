/**
 * Window 6: EMOTION — mood aura synced across windows when coupled.
 */

import { useEffect, useRef } from 'react';
import { useSharedStateWindow } from '@/hooks/useSharedStateWindow';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import type { EmotionalState, SharedState } from '@/lib/sharedState';

import { SubsystemShell, StatusChip } from '@/components/SubsystemShell';
import { ViewportFrame } from '@/components/ViewportFrame';

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
    <SubsystemShell
      accent="pink"
      role="Affect Subsystem"
      title="EMOTION"
      description="Motivation and speed. Missing Emotion leaves the body sluggish; jumps are weaker until this pane is open."
      consciousnessLevel={sharedState.consciousness.level}
      activeWindows={sharedState.consciousness.activeWindows}
      headerRight={
        <StatusChip label="Energy" value={`${Math.round(sharedState.creature.energy)}%`} accent="pink" />
      }
      footer={`${sharedState.consciousness.description} · Mood ${sharedState.creature.emotionalState}`}
    >
      <ViewportFrame accent="pink" label="Affect field · mood resonance">
        <canvas ref={canvasRef} className="h-full min-h-[240px] w-full" />
      </ViewportFrame>
    </SubsystemShell>
  );
}
