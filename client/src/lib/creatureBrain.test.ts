import { describe, expect, it } from 'vitest';
import { computePlayBounds } from '@/lib/playSpace';
import { createCreatureSim, stepCreature } from '@/lib/creatureBrain';
import { computeCapabilities } from '@/lib/subsystemGates';

describe('creatureBrain', () => {
  const bounds = computePlayBounds(900, 640);
  const caps = computeCapabilities(['body', 'vision', 'memory', 'touch', 'hearing', 'emotion']);

  it('runs toward off-screen target edge', () => {
    const sim = createCreatureSim();
    sim.pos = { x: 0.5, y: 0, z: 0.5 };

    for (let i = 0; i < 120; i += 1) {
      stepCreature({
        sim,
        target: { x: -0.6, z: 0.2 },
        bounds,
        cursor: {
          nx: 0.5,
          ny: 0.5,
          rawNx: -0.6,
          rawNy: 0.2,
          screenX: 100,
          screenY: 300,
          active: false,
        },
        caps,
        dt: 1 / 60,
        now: Date.now() + i,
      });
    }

    expect(sim.pos.x).toBeLessThan(0.45);
  });

  it('does not grab when cursor is outside body pane', () => {
    const sim = createCreatureSim();
    sim.pos = { x: 0.5, y: 0, z: 0.5 };
    sim.nearTargetSec = 0.9;

    const result = stepCreature({
      sim,
      target: { x: 0.5, z: 0.5 },
      bounds,
      cursor: {
        nx: 0.5,
        ny: 0.5,
        rawNx: 2,
        rawNy: 0.5,
        screenX: 2000,
        screenY: 400,
        active: false,
      },
      caps,
      dt: 1 / 60,
      now: Date.now(),
    });

    expect(result.caughtMouse).toBe(false);
    expect(sim.mode).toBe('chase');
  });
});
