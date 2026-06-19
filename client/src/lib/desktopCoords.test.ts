import { describe, expect, it } from 'vitest';
import { paneNormToScreen, screenPointToNorm } from '@/lib/desktopCoords';
import type { WindowPresence } from '@/lib/sharedState';

describe('desktopCoords', () => {
  const visionPresence: WindowPresence = {
    id: 'v1',
    type: 'vision',
    bounds: { x: 800, y: 60, width: 720, height: 520, centerX: 1160, centerY: 320 },
    focused: true,
    lastSeen: Date.now(),
  };

  it('maps pane-normalized coords to screen space', () => {
    const center = paneNormToScreen(0.5, 0.5, visionPresence);
    expect(center.screenX).toBe(800 + 360);
    expect(center.screenY).toBe(60 + 260);
  });

  it('maps off-screen-left pointer to negative normalized x', () => {
    const mapped = screenPointToNorm(100, 400, 500, 200, 900, 640);
    expect(mapped.rawNx).toBeLessThan(0);
    expect(mapped.rawNy).toBeCloseTo(0.3125, 3);
  });

  it('maps on-screen pointer inside 0..1', () => {
    const mapped = screenPointToNorm(950, 520, 500, 200, 900, 640);
    expect(mapped.rawNx).toBeCloseTo(0.5, 3);
    expect(mapped.rawNy).toBeCloseTo(0.5, 3);
  });
});
