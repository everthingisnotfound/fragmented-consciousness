/**
 * What the body can do depends on which subsystem tabs are open (1–6).
 * Overlap/coupling is visual only — presence of each pane type is what matters.
 */

import type { WindowType } from '@/lib/sharedState';

const ALL_SUBSYSTEMS: WindowType[] = ['body', 'vision', 'memory', 'touch', 'hearing', 'emotion'];

export interface PursuitCapabilities {
  level: number;
  complete: number;
  hasVision: boolean;
  hasMemory: boolean;
  hasTouch: boolean;
  hasHearing: boolean;
  hasEmotion: boolean;
  missing: WindowType[];
  maxSpeed: number;
  accel: number;
  friction: number;
  /** 0 = blind wander, 1 = precise chase toward perceived target */
  targetWeight: number;
  canGrab: boolean;
  canLearnJump: boolean;
  canWallLearn: boolean;
  canWindowPush: boolean;
  jumpChanceMul: number;
}

const LABELS: Record<WindowType, string> = {
  body: 'Body',
  vision: 'Vision',
  memory: 'Memory',
  touch: 'Touch',
  hearing: 'Hearing',
  emotion: 'Emotion',
};

export function subsystemLabel(type: WindowType) {
  return LABELS[type];
}

export function computeCapabilities(activeWindows: WindowType[]): PursuitCapabilities {
  const open = new Set(activeWindows);
  const level = ALL_SUBSYSTEMS.filter((t) => open.has(t)).length;
  const complete = level / ALL_SUBSYSTEMS.length;
  const missing = ALL_SUBSYSTEMS.filter((t) => !open.has(t));

  const hasVision = open.has('vision');
  const hasMemory = open.has('memory');
  const hasTouch = open.has('touch');
  const hasHearing = open.has('hearing');
  const hasEmotion = open.has('emotion');

  // Without Vision the body cannot see the cursor at all.
  const sight = hasVision ? complete * complete : 0;

  return {
    level,
    complete,
    hasVision,
    hasMemory,
    hasTouch,
    hasHearing,
    hasEmotion,
    missing,
    maxSpeed: 0.05 + complete * 0.47,
    accel: 0.15 + complete * 1.5,
    friction: 0.93 - complete * 0.05,
    targetWeight: sight,
    canGrab: hasTouch && complete >= 1,
    canLearnJump: hasMemory,
    canWallLearn: hasMemory && hasTouch,
    canWindowPush: hasHearing && hasMemory && complete >= 0.67,
    jumpChanceMul: hasEmotion ? 0.4 + complete * 0.6 : complete * 0.25,
  };
}

export interface WanderState {
  x: number;
  z: number;
  vx: number;
  vz: number;
}

export function tickWander(w: WanderState, dt: number, boundsInset = 0.06) {
  w.vx += (Math.random() - 0.5) * dt * 1.2;
  w.vz += (Math.random() - 0.5) * dt * 1.2;
  w.vx *= 0.98;
  w.vz *= 0.98;
  w.x += w.vx * dt;
  w.z += w.vz * dt;
  w.x = Math.max(boundsInset, Math.min(1 - boundsInset, w.x));
  w.z = Math.max(boundsInset, Math.min(1 - boundsInset, w.z));
}

export function resolvePerceivedTarget(
  caps: PursuitCapabilities,
  wander: WanderState,
  visionX: number | null,
  visionZ: number | null,
  smooth: { x: number; z: number },
  smoothFactor = 0.1,
): { x: number; z: number } {
  let tx = wander.x;
  let tz = wander.z;

  if (caps.targetWeight > 0 && visionX !== null && visionZ !== null) {
    if (caps.targetWeight >= 1) {
      tx = visionX;
      tz = visionZ;
    } else {
      tx = wander.x + (visionX - wander.x) * caps.targetWeight;
      tz = wander.z + (visionZ - wander.z) * caps.targetWeight;
    }
  }

  smooth.x += (tx - smooth.x) * smoothFactor;
  smooth.z += (tz - smooth.z) * smoothFactor;
  return { x: smooth.x, z: smooth.z };
}

export function impairmentHint(caps: PursuitCapabilities): string {
  if (caps.complete >= 1) return 'All subsystems online — full pursuit';
  if (!caps.hasVision) return 'Blind — open Vision and move the mouse there to give sight';
  if (caps.missing.length === 1) return `Almost whole — missing ${LABELS[caps.missing[0]]}`;
  return `Fragmented (${caps.level}/6) — needs: ${caps.missing.map((m) => LABELS[m]).join(', ')}`;
}
