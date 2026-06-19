import { describe, expect, it } from 'vitest';
import { clampToBounds, computePlayBounds, isTargetBeyondBounds } from '@/lib/playSpace';

describe('playSpace', () => {
  it('detects targets beyond tab edges', () => {
    const bounds = computePlayBounds(900, 640);
    expect(isTargetBeyondBounds(-0.2, 0.5, bounds)).toBe(true);
    expect(isTargetBeyondBounds(0.5, 0.5, bounds)).toBe(false);
  });

  it('clamps to inset bounds', () => {
    const bounds = computePlayBounds(900, 640);
    const clamped = clampToBounds(0, 1, bounds);
    expect(clamped.x).toBeGreaterThanOrEqual(bounds.minX);
    expect(clamped.z).toBeLessThanOrEqual(bounds.maxZ);
  });
});
