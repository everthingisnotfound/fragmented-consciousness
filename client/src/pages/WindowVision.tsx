/**
 * Window 2: VISION — required for the body to see the cursor. Move mouse HERE.
 */

import { useEffect, useRef } from 'react';
import { useSharedStateWindow } from '@/hooks/useSharedStateWindow';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import { SubsystemShell, StatusChip } from '@/components/SubsystemShell';
import type { SharedState } from '@/lib/sharedState';

interface Ray {
  angle: number;
  length: number;
  alpha: number;
}

export default function WindowVision() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state: sharedState, manager: stateManager } = useSharedStateWindow('vision');
  useDesktopPointerBroadcast(stateManager);
  const sharedStateRef = useRef<SharedState>(sharedState);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const raysRef = useRef<Ray[]>([]);
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

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(1, rect.width);
      const y = (e.clientY - rect.top) / Math.max(1, rect.height);
      mouseRef.current = { x, y };

      stateManager.updateSignal('visionTarget', {
        x,
        y,
        strength: 1,
        timestamp: Date.now(),
      });

      for (let i = 0; i < 3; i += 1) {
        const angle = Math.atan2(y - 0.5, x - 0.5) + (Math.random() - 0.5) * 0.4;
        raysRef.current.push({ angle, length: 0.2, alpha: 0.9 });
      }
      if (raysRef.current.length > 48) raysRef.current = raysRef.current.slice(-48);
    };

    canvas.addEventListener('mousemove', onMove);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const state = sharedStateRef.current;
      const coupled = state.consciousness.coupledWindows.includes('body');

      const grad = ctx.createRadialGradient(w * mouseRef.current.x, h * mouseRef.current.y, 0, w / 2, h / 2, w * 0.7);
      grad.addColorStop(0, '#0a2848');
      grad.addColorStop(0.5, '#060816');
      grad.addColorStop(1, '#12082a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const cx = w * mouseRef.current.x;
      const cy = h * mouseRef.current.y;

      raysRef.current = raysRef.current
        .map((r) => ({ ...r, length: r.length + 0.02, alpha: r.alpha - 0.015 }))
        .filter((r) => r.alpha > 0);

      raysRef.current.forEach((r) => {
        const len = r.length * Math.min(w, h);
        ctx.strokeStyle = `rgba(56, 189, 248, ${r.alpha * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(r.angle) * len, cy + Math.sin(r.angle) * len);
        ctx.stroke();
      });

      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.strokeStyle = coupled ? 'rgba(22, 244, 255, 0.9)' : 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(22, 244, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stateManager]);

  const coupling = sharedState.consciousness.coupling;

  return (
    <SubsystemShell
      accent="sky"
      role="Optic Subsystem"
      title="VISION"
      description={
        <>
          <strong>Required for sight.</strong> Move the mouse in any window — launcher included — and the body tracks
          you across the desktop.
        </>
      }
      headerRight={<StatusChip label="Consciousness" value={`${sharedState.consciousness.level}/6`} accent="sky" />}
      footer={`Coupling ${Math.round(coupling * 100)}% · Perception rays follow your pointer`}
    >
      <canvas ref={canvasRef} className="h-full w-full cursor-crosshair" />
    </SubsystemShell>
  );
}
