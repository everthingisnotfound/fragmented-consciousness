/**
 * Shared creature + target on the desktop (screen pixel coords).
 * Y uses screenY; mapped to 3D as (x, 0, y) with world offset handling sync.
 */

export type TargetSource = 'hand' | 'mouse' | 'none';

export interface MistakePoint {
  x: number;
  y: number;
  t: number;
}

export interface DesktopWorldState {
  creature: { x: number; y: number };
  target: { x: number; y: number };
  targetSource: TargetSource;
  mistakes: MistakePoint[];
  updatedAt: number;
}

const KEY = 'fc-desktop-world';

const DEFAULT: DesktopWorldState = {
  creature: { x: 0, y: 0 },
  target: { x: 0, y: 0 },
  targetSource: 'none',
  mistakes: [],
  updatedAt: Date.now(),
};

export function readWorldState(): DesktopWorldState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT, creature: { x: 0, y: 0 }, target: { x: 0, y: 0 } };
    const parsed = JSON.parse(raw) as DesktopWorldState;
    return { ...DEFAULT, ...parsed };
  } catch {
    return { ...DEFAULT };
  }
}

export function writeWorldState(state: DesktopWorldState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function subscribeWorldState(listener: (state: DesktopWorldState) => void) {
  const handler = (event: StorageEvent) => {
    if (event.key === KEY) listener(readWorldState());
  };
  addEventListener('storage', handler);
  listener(readWorldState());
  return () => removeEventListener('storage', handler);
}

export function centerOfWindow(): { x: number; y: number } {
  const sx = window.screenLeft ?? window.screenX ?? 0;
  const sy = window.screenTop ?? window.screenY ?? 0;
  return { x: sx + window.innerWidth / 2, y: sy + window.innerHeight / 2 };
}

/** Force creature to this window's center (fixes off-screen drift). */
export function recenterCreature() {
  const c = centerOfWindow();
  const state = readWorldState();
  state.creature = { ...c };
  state.target = { ...c };
  state.targetSource = 'none';
  state.updatedAt = Date.now();
  writeWorldState(state);
  return state;
}

export function seedWorldIfNeeded() {
  const state = readWorldState();
  if (state.creature.x === 0 && state.creature.y === 0) {
    return recenterCreature();
  }
  return state;
}

export function recordMistake(x: number, y: number) {
  const state = readWorldState();
  const last = state.mistakes[state.mistakes.length - 1];
  if (last && Math.hypot(last.x - x, last.y - y) < 40 && Date.now() - last.t < 2000) return;
  state.mistakes = state.mistakes.concat({ x, y, t: Date.now() }).slice(-48);
  state.updatedAt = Date.now();
  writeWorldState(state);
}

export function repelFromMistakes(x: number, y: number, radius = 80) {
  const mistakes = readWorldState().mistakes;
  let px = x;
  let py = y;
  const now = Date.now();

  for (const m of mistakes) {
    if (now - m.t > 120_000) continue;
    const dx = px - m.x;
    const dy = py - m.y;
    const dist = Math.hypot(dx, dy);
    if (dist < radius && dist > 1) {
      const force = ((radius - dist) / radius) * 12;
      px += (dx / dist) * force;
      py += (dy / dist) * force;
    }
  }
  return { x: px, y: py };
}

export function clearWorldState() {
  localStorage.removeItem(KEY);
}
