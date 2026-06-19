/**
 * Window 4: TOUCH — click sends haptic pulse; body flinches when coupled.
 */

import { useEffect, useRef } from 'react';
import { useSharedStateWindow } from '@/hooks/useSharedStateWindow';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import type { SharedState } from '@/lib/sharedState';

import { SubsystemShell, StatusChip } from '@/components/SubsystemShell';
import { ViewportFrame } from '@/components/ViewportFrame';

interface Pulse {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

export default function WindowTouch() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state: sharedState, manager: stateManager } = useSharedStateWindow('touch');
  useDesktopPointerBroadcast(stateManager);
  const sharedStateRef = useRef<SharedState>(sharedState);
  const pulsesRef = useRef<Pulse[]>([]);
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
      pulsesRef.current.push({ x, y, r: 0.02, alpha: 1 });
      stateManager.updateSignal('touchPulse', { x, y, strength: 1, timestamp: Date.now() });
    };

    canvas.addEventListener('click', onClick);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0a0618';
      ctx.fillRect(0, 0, w, h);

      pulsesRef.current = pulsesRef.current
        .map((p) => ({ ...p, r: p.r + 0.012, alpha: p.alpha - 0.02 }))
        .filter((p) => p.alpha > 0);

      pulsesRef.current.forEach((p) => {
        const px = p.x * w;
        const py = p.y * h;
        const radius = p.r * Math.min(w, h);
        ctx.strokeStyle = `rgba(255, 45, 248, ${p.alpha * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 45, 248, ${p.alpha * 0.15})`;
        ctx.fill();
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
      accent="fuchsia"
      role="Haptic Subsystem"
      title="TOUCH"
      description="Haptic sense of edges + grab. All six tabs must be open before it can catch the cursor. Click to send pulses."
      consciousnessLevel={sharedState.consciousness.level}
      activeWindows={sharedState.consciousness.activeWindows}
      headerRight={
        <StatusChip label="Coupling" value={`${Math.round(sharedState.consciousness.coupling * 100)}%`} accent="fuchsia" />
      }
      footer="Click anywhere in the viewport to send a haptic pulse to the body"
    >
      <ViewportFrame accent="fuchsia" label="Haptic mesh · click to pulse">
        <canvas ref={canvasRef} className="h-full min-h-[240px] w-full cursor-crosshair" />
      </ViewportFrame>
    </SubsystemShell>
  );
}
