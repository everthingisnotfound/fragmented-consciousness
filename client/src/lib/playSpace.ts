/**
 * Play area matches the Body tab canvas — bounds are 0..1 with a small inset.
 */

export interface PlayBounds {
  /** Normalized X limits inside the tab (0 = left edge, 1 = right). */
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Three.js floor size derived from tab aspect ratio. */
  renderWidth: number;
  renderDepth: number;
  tabWidth: number;
  tabHeight: number;
}

const RENDER_DEPTH = 10;

/** Margin so the figure's feet don't clip the tab edge (fraction of tab). */
function edgeInset(tabWidth: number, tabHeight: number) {
  const base = 0.018;
  const extra = Math.min(tabWidth, tabHeight) < 400 ? 0.022 : 0;
  return base + extra;
}

export function computePlayBounds(tabWidth: number, tabHeight: number): PlayBounds {
  const w = Math.max(tabWidth, 1);
  const h = Math.max(tabHeight, 1);
  const inset = edgeInset(w, h);
  const aspect = w / h;

  return {
    minX: inset,
    maxX: 1 - inset,
    minZ: inset,
    maxZ: 1 - inset,
    renderWidth: RENDER_DEPTH * aspect,
    renderDepth: RENDER_DEPTH,
    tabWidth: w,
    tabHeight: h,
  };
}

/** Normalized tab position → Three.js floor coords (centered). */
export function normToRender(nx: number, nz: number, bounds: PlayBounds) {
  return {
    x: (nx - 0.5) * bounds.renderWidth,
    y: 0,
    z: (nz - 0.5) * bounds.renderDepth,
  };
}

export function renderToNorm(x: number, z: number, bounds: PlayBounds) {
  return {
    x: x / bounds.renderWidth + 0.5,
    z: z / bounds.renderDepth + 0.5,
  };
}

/** Target in tab-normalized space; values may lie outside 0..1 when cursor is past the tab edge. */
export function cursorToTarget(rawNx: number, rawNy: number): { x: number; z: number } {
  return { x: rawNx, z: rawNy };
}

export function isTargetBeyondBounds(tx: number, tz: number, bounds: PlayBounds) {
  return tx < bounds.minX || tx > bounds.maxX || tz < bounds.minZ || tz > bounds.maxZ;
}

export function clampToBounds(nx: number, nz: number, bounds: PlayBounds) {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, nx)),
    z: Math.max(bounds.minZ, Math.min(bounds.maxZ, nz)),
  };
}
