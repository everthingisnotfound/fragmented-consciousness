/**
 * Window 5: HEARING — click sends audio pulse; body orients when coupled.
 */

import { useEffect, useRef } from 'react';
import { useSharedStateWindow } from '@/hooks/useSharedStateWindow';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import { SubsystemShell, StatusChip } from '@/components/SubsystemShell';
import { ViewportFrame } from '@/components/ViewportFrame';
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
    <SubsystemShell
      accent="amber"
      role="Audio Subsystem"
      title="HEARING"
      description="Sound beyond the tab edge. With Memory open, helps the body nudge the window when the cursor is out of reach."
      consciousnessLevel={sharedState.consciousness.level}
      activeWindows={sharedState.consciousness.activeWindows}
      headerRight={
        <StatusChip
          label="Coupling"
          value={`${Math.round(sharedState.consciousness.coupling * 100)}%`}
          accent="amber"
        />
      }
      footer={`Emotion: ${sharedState.creature.emotionalState} · Click to emit sound ripples`}
    >
      <ViewportFrame accent="amber" label="Audio field · click for ripples">
        <canvas ref={canvasRef} className="h-full min-h-[240px] w-full cursor-crosshair" />
      </ViewportFrame>
    </SubsystemShell>
  );
}
