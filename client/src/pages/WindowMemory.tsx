/**
 * Window 3: MEMORY — path trails and danger zones from shared memory.
 */

import { useEffect, useRef } from 'react';
import { useSharedStateWindow } from '@/hooks/useSharedStateWindow';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import { SubsystemShell, StatusChip } from '@/components/SubsystemShell';
import { ViewportFrame } from '@/components/ViewportFrame';
import type { SharedState } from '@/lib/sharedState';

const PATH_COLORS: Record<string, string> = {
  safe: 'rgba(120, 255, 106, 0.55)',
  exploration: 'rgba(56, 189, 248, 0.45)',
  danger: 'rgba(255, 63, 110, 0.75)',
  collision: 'rgba(255, 120, 60, 0.7)',
};

export default function WindowMemory() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state: sharedState, manager: stateManager } = useSharedStateWindow('memory');
  useDesktopPointerBroadcast(stateManager);
  const sharedStateRef = useRef<SharedState>(sharedState);
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

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const state = sharedStateRef.current;

      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(22, 244, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      state.memory.paths.slice(-80).forEach((path) => {
        if (path.points.length < 2) return;
        ctx.strokeStyle = PATH_COLORS[path.type] || PATH_COLORS.exploration;
        ctx.lineWidth = path.type === 'danger' ? 3 : 2;
        ctx.beginPath();
        path.points.forEach((pt, i) => {
          const px = pt.x * w;
          const py = (pt.z ?? pt.y) * h;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      });

      const cp = state.creature.position;
      ctx.fillStyle = 'rgba(22, 244, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(cp.x * w, (cp.z ?? cp.y) * h, 8, 0, Math.PI * 2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const dangers = sharedState.memory.paths.filter((p) => p.type === 'danger').length;

  return (
    <SubsystemShell
      accent="emerald"
      role="Recall Subsystem"
      title="MEMORY"
      description="Records paths and danger zones. Without this pane the body cannot learn jumps or avoid mistakes."
      consciousnessLevel={sharedState.consciousness.level}
      activeWindows={sharedState.consciousness.activeWindows}
      headerRight={<StatusChip label="Paths" value={sharedState.memory.paths.length} accent="emerald" />}
      footer={`${dangers} danger zones · Coupling ${Math.round(sharedState.consciousness.coupling * 100)}%`}
    >
      <ViewportFrame accent="emerald" label="Recall map · path history">
        <canvas ref={canvasRef} className="h-full min-h-[240px] w-full" />
      </ViewportFrame>
    </SubsystemShell>
  );
}
