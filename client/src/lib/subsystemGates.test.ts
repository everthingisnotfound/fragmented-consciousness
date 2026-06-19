import { describe, expect, it } from 'vitest';
import { computeCapabilities, resolvePerceivedTarget } from '@/lib/subsystemGates';

describe('subsystemGates', () => {
  it('is blind without Vision even at partial consciousness', () => {
    const caps = computeCapabilities(['body', 'memory', 'touch']);
    expect(caps.hasVision).toBe(false);
    expect(caps.targetWeight).toBe(0);
  });

  it('gains sight weight when Vision is open', () => {
    const caps = computeCapabilities(['body', 'vision', 'memory', 'touch', 'hearing', 'emotion']);
    expect(caps.targetWeight).toBe(1);
    expect(caps.canGrab).toBe(true);
  });

  it('chases mapped off-screen target at full consciousness', () => {
    const caps = computeCapabilities(['body', 'vision', 'memory', 'touch', 'hearing', 'emotion']);
    const smooth = { x: 0.5, z: 0.5 };
    const result = resolvePerceivedTarget(caps, { x: 0.5, z: 0.5, vx: 0, vz: 0 }, -0.4, 0.2, smooth, 1);
    expect(result.x).toBeLessThan(0.5);
    expect(result.z).toBeLessThan(0.5);
  });
});
