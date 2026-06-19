/**
 * Pursuit physics in tab-normalized space (0..1 = full canvas).
 */

import type { PlayBounds } from '@/lib/playSpace';
import { clampToBounds, isTargetBeyondBounds } from '@/lib/playSpace';
import type { PursuitCapabilities } from '@/lib/subsystemGates';

const GRAVITY = 22;
const CATCH_RADIUS = 0.028;
const GRAB_HOLD_MS = 3200;
const GRAB_SUSTAIN_SEC = 0.65;
const GRAB_LUNGE_SEC = 0.28;
const WINDOW_PUSH_MS = 2800;
const WALL_PUSH_THRESHOLD = 3;

export type BehaviorMode = 'chase' | 'jumping' | 'grabbed' | 'window_push' | 'release';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CursorTarget {
  nx: number;
  ny: number;
  rawNx: number;
  rawNy: number;
  screenX: number;
  screenY: number;
  active: boolean;
}

export interface LearnedSkills {
  jumpAffinity: number;
  wallAwareness: number;
  windowPushLearned: boolean;
  grabs: number;
}

export interface CreatureSim {
  pos: Vec3;
  vel: Vec3;
  mode: BehaviorMode;
  modeUntil: number;
  onGround: boolean;
  lastDist: number;
  wallStreak: number;
  skills: LearnedSkills;
  jumpCooldown: number;
  nearTargetSec: number;
}

export function createCreatureSim(): CreatureSim {
  return {
    pos: { x: 0.5, y: 0, z: 0.5 },
    vel: { x: 0, y: 0, z: 0 },
    mode: 'chase',
    modeUntil: 0,
    onGround: true,
    lastDist: 999,
    wallStreak: 0,
    skills: { jumpAffinity: 0.15, wallAwareness: 0, windowPushLearned: false, grabs: 0 },
    jumpCooldown: 0,
    nearTargetSec: 0,
  };
}

function distXZ(a: Vec3, b: { x: number; z: number }) {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

export interface SimInput {
  sim: CreatureSim;
  target: { x: number; z: number };
  bounds: PlayBounds;
  cursor: CursorTarget;
  caps: PursuitCapabilities;
  dt: number;
  now: number;
  memoryRepel?: (x: number, z: number) => { x: number; z: number };
}

export interface SimOutput {
  hitBoundary: boolean;
  caughtMouse: boolean;
  releasedGrab: boolean;
  startedWindowPush: boolean;
  attemptedJump: boolean;
}

export function stepCreature(input: SimInput): SimOutput {
  const { sim, target, bounds, cursor, caps, dt, now } = input;
  const out: SimOutput = {
    hitBoundary: false,
    caughtMouse: false,
    releasedGrab: false,
    startedWindowPush: false,
    attemptedJump: false,
  };

  if (sim.jumpCooldown > 0) sim.jumpCooldown -= dt;

  const chaseX = Math.max(bounds.minX, Math.min(bounds.maxX, target.x));
  const chaseZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, target.z));
  const beyond = isTargetBeyondBounds(target.x, target.z, bounds);

  if (sim.mode === 'grabbed') {
    sim.pos.x = chaseX;
    sim.pos.z = chaseZ;
    sim.pos.y = 0.15 + Math.sin(now * 0.008) * 0.05;
    sim.vel = { x: 0, y: 0, z: 0 };
    if (now >= sim.modeUntil) {
      sim.mode = 'release';
      sim.modeUntil = now + 600;
      sim.vel = {
        x: (Math.random() - 0.5) * 0.12,
        y: 3.5,
        z: (Math.random() - 0.5) * 0.12,
      };
      out.releasedGrab = true;
    }
    return out;
  }

  if (sim.mode === 'release') {
    sim.vel.y -= GRAVITY * dt;
    sim.pos.x += sim.vel.x * dt;
    sim.pos.y += sim.vel.y * dt;
    sim.pos.z += sim.vel.z * dt;
    sim.vel.x *= 0.96;
    sim.vel.z *= 0.96;
    if (sim.pos.y <= 0) {
      sim.pos.y = 0;
      sim.vel.y = 0;
      sim.mode = 'chase';
      sim.onGround = true;
      const c = clampToBounds(sim.pos.x, sim.pos.z, bounds);
      sim.pos.x = c.x;
      sim.pos.z = c.z;
    }
    return out;
  }

  if (sim.mode === 'window_push') {
    sim.vel.x *= 0.88;
    sim.vel.z *= 0.88;
    nudgeWindowToward(cursor.screenX, cursor.screenY);

    const lungeGrabDist = cursor.active ? distXZ(sim.pos, { x: cursor.nx, z: cursor.ny }) : 999;
    const sustainNeed = cursor.active ? GRAB_LUNGE_SEC : GRAB_SUSTAIN_SEC;

    if (cursor.active && caps.canGrab) {
      const dx = cursor.nx - sim.pos.x;
      const dz = cursor.ny - sim.pos.z;
      const len = Math.max(0.001, Math.hypot(dx, dz));
      sim.vel.x += (dx / len) * caps.accel * 1.8 * dt;
      sim.vel.z += (dz / len) * caps.accel * 1.8 * dt;

      if (
        lungeGrabDist < CATCH_RADIUS * 2.2 &&
        sim.onGround &&
        Math.hypot(sim.vel.x, sim.vel.z) < 0.12
      ) {
        sim.nearTargetSec += dt * 2.2;
      } else {
        sim.nearTargetSec = Math.max(0, sim.nearTargetSec - dt);
      }

      if (sim.nearTargetSec >= sustainNeed) {
        sim.mode = 'grabbed';
        sim.modeUntil = now + GRAB_HOLD_MS;
        sim.nearTargetSec = 0;
        sim.skills.grabs += 1;
        out.caughtMouse = true;
        return out;
      }
    } else {
      sim.nearTargetSec = Math.max(0, sim.nearTargetSec - dt * 2);
    }

    if (now >= sim.modeUntil) {
      sim.mode = 'chase';
      sim.wallStreak = 0;
      sim.skills.windowPushLearned = true;
      sim.skills.wallAwareness = Math.min(1, sim.skills.wallAwareness + 0.25);
    }
    return out;
  }

  const dist = distXZ(sim.pos, { x: chaseX, z: chaseZ });
  sim.lastDist = dist;
  const speed = Math.hypot(sim.vel.x, sim.vel.z);
  const grabDist = cursor.active ? distXZ(sim.pos, { x: cursor.nx, z: cursor.ny }) : 999;

  if (
    caps.canGrab &&
    cursor.active &&
    grabDist < CATCH_RADIUS &&
    speed < 0.06 &&
    sim.onGround &&
    sim.pos.y < 0.2
  ) {
    sim.nearTargetSec += dt;
  } else {
    sim.nearTargetSec = Math.max(0, sim.nearTargetSec - dt * 2);
  }

  if (sim.nearTargetSec >= GRAB_SUSTAIN_SEC && cursor.active) {
    sim.mode = 'grabbed';
    sim.modeUntil = now + GRAB_HOLD_MS;
    sim.nearTargetSec = 0;
    sim.skills.grabs += 1;
    out.caughtMouse = true;
    return out;
  }

  if (!cursor.active) {
    sim.nearTargetSec = 0;
  }

  const dx = chaseX - sim.pos.x;
  const dz = chaseZ - sim.pos.z;
  const len = Math.max(0.001, Math.hypot(dx, dz));
  const edgeBoost = beyond ? 1.45 : 1;
  const ax = (dx / len) * caps.accel * edgeBoost;
  const az = (dz / len) * caps.accel * edgeBoost;

  if (input.memoryRepel) {
    const repelled = input.memoryRepel(sim.pos.x, sim.pos.z);
    sim.vel.x += (repelled.x - sim.pos.x) * 3.5 * dt;
    sim.vel.z += (repelled.z - sim.pos.z) * 3.5 * dt;
  }

  sim.vel.x += ax * dt;
  sim.vel.z += az * dt;

  const hSpeed = Math.hypot(sim.vel.x, sim.vel.z);
  if (hSpeed > caps.maxSpeed) {
    sim.vel.x = (sim.vel.x / hSpeed) * caps.maxSpeed;
    sim.vel.z = (sim.vel.z / hSpeed) * caps.maxSpeed;
  }

  sim.vel.x *= caps.friction;
  sim.vel.z *= caps.friction;

  const preJumpDist = dist;

  const wantsJump =
    caps.canLearnJump &&
    sim.onGround &&
    sim.jumpCooldown <= 0 &&
    dist > 0.12 &&
    (sim.skills.jumpAffinity > 0.35 || dist > 0.22) &&
    (dist > 0.18 || sim.wallStreak > 0);

  if (wantsJump && Math.random() < (0.02 + sim.skills.jumpAffinity * 0.04) * caps.jumpChanceMul) {
    sim.vel.y = 6.5 + sim.skills.jumpAffinity * 2;
    sim.onGround = false;
    sim.mode = 'jumping';
    sim.jumpCooldown = 0.45;
    out.attemptedJump = true;
  }

  if (sim.mode === 'jumping' || sim.pos.y > 0) {
    sim.vel.y -= GRAVITY * dt;
    sim.pos.y += sim.vel.y * dt;
    if (sim.pos.y <= 0) {
      const landedDist = distXZ(sim.pos, { x: chaseX, z: chaseZ });
      if (caps.canLearnJump && preJumpDist - landedDist > 0.04) {
        sim.skills.jumpAffinity = Math.min(1, sim.skills.jumpAffinity + 0.08);
      } else if (caps.canLearnJump && preJumpDist > 0.15) {
        sim.skills.jumpAffinity = Math.max(0.05, sim.skills.jumpAffinity - 0.02);
      }
      sim.pos.y = 0;
      sim.vel.y = 0;
      sim.onGround = true;
      sim.mode = 'chase';
    }
  }

  sim.pos.x += sim.vel.x * dt;
  sim.pos.z += sim.vel.z * dt;

  let hitWall = false;

  if (sim.pos.x <= bounds.minX) {
    sim.pos.x = bounds.minX;
    sim.vel.x = Math.max(0, sim.vel.x) * 0.08;
    hitWall = true;
  } else if (sim.pos.x >= bounds.maxX) {
    sim.pos.x = bounds.maxX;
    sim.vel.x = Math.min(0, sim.vel.x) * 0.08;
    hitWall = true;
  }

  if (sim.pos.z <= bounds.minZ) {
    sim.pos.z = bounds.minZ;
    sim.vel.z = Math.max(0, sim.vel.z) * 0.08;
    hitWall = true;
  } else if (sim.pos.z >= bounds.maxZ) {
    sim.pos.z = bounds.maxZ;
    sim.vel.z = Math.min(0, sim.vel.z) * 0.08;
    hitWall = true;
  }

  if (hitWall) {
    out.hitBoundary = true;
    if (caps.canWallLearn) {
      sim.skills.wallAwareness = Math.min(1, sim.skills.wallAwareness + 0.06);
    }
    if (beyond || !cursor.active) {
      sim.wallStreak += 1;
      if (
        caps.canWindowPush &&
        sim.wallStreak >= WALL_PUSH_THRESHOLD &&
        (beyond || !cursor.active) &&
        sim.mode === 'chase' &&
        sim.skills.wallAwareness > 0.25
      ) {
        sim.mode = 'window_push';
        sim.modeUntil = now + WINDOW_PUSH_MS;
        out.startedWindowPush = true;
      } else if (sim.wallStreak >= 2 && sim.onGround && sim.jumpCooldown <= 0 && dist > 0.08) {
        sim.vel.y = 5.5;
        sim.onGround = false;
        sim.mode = 'jumping';
        sim.jumpCooldown = 0.5;
        out.attemptedJump = true;
      }
    } else {
      sim.wallStreak = 0;
    }
  } else {
    sim.wallStreak = Math.max(0, sim.wallStreak - dt * 0.5);
  }

  return out;
}

function nudgeWindowToward(screenX: number, screenY: number) {
  if (screenX == null || screenY == null) return;
  const sx = window.screenLeft ?? window.screenX ?? 0;
  const sy = window.screenTop ?? window.screenY ?? 0;
  const w = window.outerWidth;
  const h = window.outerHeight;
  const cx = sx + w / 2;
  const cy = sy + h / 2;
  const dx = screenX - cx;
  const dy = screenY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < 24) return;
  const step = Math.min(14, dist * 0.06);
  try {
    window.moveTo(Math.round(sx + (dx / dist) * step), Math.round(sy + (dy / dist) * step));
  } catch {
    /* popup may block moveTo */
  }
}

export function modeLabel(mode: BehaviorMode, blind = false): string {
  if (blind && mode === 'chase') return 'wandering blind';
  switch (mode) {
    case 'grabbed':
      return 'holding cursor';
    case 'window_push':
      return 'pushing window toward you';
    case 'jumping':
      return 'jumping';
    case 'release':
      return 'letting go';
    default:
      return 'chasing';
  }
}
