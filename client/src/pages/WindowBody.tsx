/**
 * Window 1: BODY — movement only; other tabs unlock sight, memory, touch, hearing, emotion.
 */

import { useEffect, useRef, useState } from 'react';
import { useSharedStateWindow } from '@/hooks/useSharedStateWindow';
import { useDesktopPointerBroadcast } from '@/hooks/useDesktopPointerBroadcast';
import { HandTracker } from '@/lib/handTracking';
import {
  createCreatureSim,
  modeLabel,
  stepCreature,
  type CreatureSim,
  type CursorTarget,
} from '@/lib/creatureBrain';
import { computePlayBounds, isTargetBeyondBounds, normToRender } from '@/lib/playSpace';
import { Pill, StatusChip, SubsystemShell } from '@/components/SubsystemShell';
import { ViewportFrame } from '@/components/ViewportFrame';
import {
  isInsideContainer,
  mapPaneNormToContainer,
  screenToContainerNorm,
} from '@/lib/desktopCoords';
import {
  computeCapabilities,
  impairmentHint,
  resolvePerceivedTarget,
  subsystemLabel,
  tickWander,
  type WanderState,
} from '@/lib/subsystemGates';
import type { SharedState } from '@/lib/sharedState';
import { createThreeScene, type ThreeScene } from '@/lib/threeSetup';

const emotionAccent: Record<string, number> = {
  curious: 0x16f4ff,
  happy: 0xfff36a,
  fearful: 0x9f5cff,
  excited: 0x78ff6a,
  calm: 0x6afff5,
};

export default function WindowBody() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ThreeScene | null>(null);
  const handRef = useRef<HandTracker | null>(null);
  const simRef = useRef<CreatureSim>(createCreatureSim());
  const wanderRef = useRef<WanderState>({ x: 0.5, z: 0.5, vx: 0, vz: 0 });
  const smoothTargetRef = useRef({ x: 0.5, z: 0.5 });
  const lastPointerRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const boundsKeyRef = useRef('');
  const { state: sharedState, manager: stateManager } = useSharedStateWindow('body');
  useDesktopPointerBroadcast(stateManager);
  const sharedStateRef = useRef<SharedState>(sharedState);
  const cursorRef = useRef<CursorTarget>({
    nx: 0.5,
    ny: 0.5,
    rawNx: 0.5,
    rawNy: 0.5,
    screenX: 0,
    screenY: 0,
    active: false,
  });
  const previousPathPointRef = useRef({ x: 0.5, y: 0, z: 0.5 });
  const frameRef = useRef(0);
  const [modelReady, setModelReady] = useState(false);
  const [handOn, setHandOn] = useState(false);
  const [handStatus, setHandStatus] = useState<'off' | 'starting' | 'on' | 'error'>('off');
  const [hud, setHud] = useState({
    mode: 'wandering blind',
    jump: 15,
    walls: 0,
    grabs: 0,
    hint: '',
    level: 1,
    cursorInPane: false,
  });

  sharedStateRef.current = sharedState;

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = createThreeScene(containerRef.current);
    sceneRef.current = scene;
    const creatureMesh = scene.createCreature();

    const checkModel = setInterval(() => {
      if (scene.modelLoaded) {
        setModelReady(true);
        clearInterval(checkModel);
      }
    }, 200);

    const animate = (dt: number) => {
      const container = containerRef.current;
      if (!container) return;

      frameRef.current += 1;
      const currentState = sharedStateRef.current;
      const active = currentState.consciousness.activeWindows;
      const caps = computeCapabilities(active);
      const emotion = caps.hasEmotion ? currentState.creature.emotionalState : 'curious';
      const sim = simRef.current;

      const bounds = computePlayBounds(container.clientWidth, container.clientHeight);
      const boundsKey = `${bounds.tabWidth}x${bounds.tabHeight}`;
      if (boundsKey !== boundsKeyRef.current) {
        boundsKeyRef.current = boundsKey;
        scene.setPlayBounds(bounds);
      }

      if (caps.targetWeight < 0.5) {
        tickWander(wanderRef.current, dt, bounds.minX);
      }

      const windows = currentState.consciousness.windows;
      const now = Date.now();

      if (handRef.current?.isRunning() && caps.hasVision && caps.complete >= 1) {
        const hand = handRef.current.sample();
        if (hand.active && container) {
          const mapped = screenToContainerNorm(hand.x, hand.y, container);
          cursorRef.current = {
            nx: Math.max(0, Math.min(1, mapped.rawNx)),
            ny: Math.max(0, Math.min(1, mapped.rawNy)),
            rawNx: mapped.rawNx,
            rawNy: mapped.rawNy,
            screenX: hand.x,
            screenY: hand.y,
            active: isInsideContainer(mapped.rawNx, mapped.rawNy),
          };
        }
      }

      const visionSignal = currentState.sensorium.visionTarget;
      const visionFresh = visionSignal && Date.now() - visionSignal.timestamp < 2000;
      const pointerSignal = currentState.sensorium.desktopPointer;
      if (pointerSignal) {
        lastPointerRef.current = {
          x: pointerSignal.x,
          y: pointerSignal.y,
          t: pointerSignal.timestamp,
        };
      }
      const pointerAge = lastPointerRef.current ? now - lastPointerRef.current.t : Infinity;
      const pointerUsable = caps.hasVision && lastPointerRef.current && pointerAge < 8000;
      let visionX: number | null = null;
      let visionZ: number | null = null;

      if (pointerUsable && lastPointerRef.current) {
        const mapped = screenToContainerNorm(
          lastPointerRef.current.x,
          lastPointerRef.current.y,
          container,
        );
        visionX = mapped.rawNx;
        visionZ = mapped.rawNy;
        cursorRef.current = {
          nx: Math.max(0, Math.min(1, mapped.rawNx)),
          ny: Math.max(0, Math.min(1, mapped.rawNy)),
          rawNx: mapped.rawNx,
          rawNy: mapped.rawNy,
          screenX: lastPointerRef.current.x,
          screenY: lastPointerRef.current.y,
          active: isInsideContainer(mapped.rawNx, mapped.rawNy),
        };
      } else if (caps.hasVision && visionFresh && windows.vision) {
        const mapped = mapPaneNormToContainer(
          visionSignal!.x,
          visionSignal!.y,
          windows.vision,
          container,
        );
        visionX = mapped.rawNx;
        visionZ = mapped.rawNy;
      }

      const smoothFactor = 0.06 + caps.complete * 0.1;
      const perceived = resolvePerceivedTarget(
        caps,
        wanderRef.current,
        visionX,
        visionZ,
        smoothTargetRef.current,
        smoothFactor,
      );
      const target = { x: perceived.x, z: perceived.z };

      const memoryRepel =
        caps.hasMemory
          ? (x: number, z: number) => {
              let px = x;
              let pz = z;
              const dangers = currentState.memory.paths.filter((p) => p.type === 'danger' || p.type === 'collision');
              for (const path of dangers.slice(-24)) {
                for (const pt of path.points) {
                  const rx = px - pt.x;
                  const rz = pz - pt.z;
                  const dist = Math.hypot(rx, rz);
                  if (dist < 0.06 && dist > 0.002) {
                    const force = (0.06 - dist) * 0.2 * caps.complete;
                    px += (rx / dist) * force;
                    pz += (rz / dist) * force;
                  }
                }
              }
              return { x: px, z: pz };
            }
          : undefined;

      const result = stepCreature({
        sim,
        target,
        bounds,
        cursor: cursorRef.current,
        caps,
        dt,
        now,
        memoryRepel,
      });

      const touchSignal = currentState.sensorium.touchPulse;
      if (
        caps.hasTouch &&
        touchSignal &&
        now - touchSignal.timestamp < 1200 &&
        sim.mode === 'chase' &&
        windows.touch
      ) {
        const mapped = mapPaneNormToContainer(touchSignal.x, touchSignal.y, windows.touch, container);
        const awayX = sim.pos.x - mapped.rawNx;
        const awayZ = sim.pos.z - mapped.rawNy;
        const dist = Math.max(0.001, Math.hypot(awayX, awayZ));
        sim.vel.x += (awayX / dist) * 0.12 * caps.complete;
        sim.vel.z += (awayZ / dist) * 0.12 * caps.complete;
      }

      const soundSignal = currentState.sensorium.soundPulse;
      if (
        caps.hasHearing &&
        soundSignal &&
        now - soundSignal.timestamp < 1600 &&
        sim.mode === 'chase' &&
        windows.hearing
      ) {
        const mapped = mapPaneNormToContainer(soundSignal.x, soundSignal.y, windows.hearing, container);
        const towardX = mapped.rawNx - sim.pos.x;
        const towardZ = mapped.rawNy - sim.pos.z;
        const dist = Math.max(0.001, Math.hypot(towardX, towardZ));
        sim.vel.x += (towardX / dist) * 0.08 * caps.complete;
        sim.vel.z += (towardZ / dist) * 0.08 * caps.complete;
      }

      const render = normToRender(sim.pos.x, sim.pos.z, bounds);
      creatureMesh.position.set(render.x, sim.pos.y, render.z);
      const speed = Math.hypot(sim.vel.x, sim.vel.z);
      if (speed > 0.002) {
        const heading = Math.atan2(sim.vel.x, sim.vel.z);
        creatureMesh.rotation.y += (heading - creatureMesh.rotation.y) * 0.14;
      }

      const blind = caps.targetWeight < 0.05;
      const grabbed = sim.mode === 'grabbed';
      const targetOffScreen =
        caps.hasVision &&
        visionX !== null &&
        visionZ !== null &&
        isTargetBeyondBounds(visionX, visionZ, bounds);

      scene.updateCameraFocus(render.x, render.z);
      scene.setGrabbedVisual(grabbed, render.x, render.z);
      scene.setCursorHint(
        cursorRef.current.rawNx,
        cursorRef.current.rawNy,
        bounds,
        Boolean(targetOffScreen && !grabbed),
      );
      scene.followTarget(render.x, render.z, sim.pos.y);
      scene.setCreatureCharge(
        grabbed ? 1 : caps.complete + sim.skills.jumpAffinity * 0.15,
        emotionAccent[emotion] || 0x16f4ff,
      );

      if (caps.hasMemory && result.hitBoundary && frameRef.current % 24 === 0) {
        stateManager.addPath({
          points: [{ x: sim.pos.x, y: sim.pos.y, z: sim.pos.z }],
          type: 'danger',
          timestamp: now,
        });
      }

      if (caps.hasMemory && frameRef.current % 18 === 0) {
        stateManager.addPath({
          points: [previousPathPointRef.current, { x: sim.pos.x, y: sim.pos.y, z: sim.pos.z }],
          type: result.hitBoundary ? 'danger' : caps.complete > 0.8 ? 'safe' : 'exploration',
          timestamp: now,
        });
        previousPathPointRef.current = { x: sim.pos.x, y: sim.pos.y, z: sim.pos.z };
      }

      stateManager.updateCreature({
        position: { x: sim.pos.x, y: sim.pos.y, z: sim.pos.z },
        velocity: { x: sim.vel.x, y: sim.vel.y, z: sim.vel.z },
        state:
          grabbed ? 'resting' : result.hitBoundary ? 'fleeing' : sim.mode === 'window_push' ? 'learning' : 'exploring',
        emotionalState: grabbed ? 'happy' : result.hitBoundary ? 'fearful' : caps.hasEmotion ? emotion : 'curious',
        energy: Math.max(15, Math.min(100, 25 + caps.complete * 60 + speed * 80)),
        heading: Math.atan2(sim.vel.x, sim.vel.z),
      });

      if (frameRef.current % 12 === 0) {
        setHud({
          mode: modeLabel(sim.mode, blind),
          jump: Math.round(sim.skills.jumpAffinity * 100),
          walls: Math.round(sim.skills.wallAwareness * 100),
          grabs: sim.skills.grabs,
          hint: impairmentHint(caps),
          level: caps.level,
          cursorInPane: cursorRef.current.active,
        });
      }
    };

    scene.animate(animate);

    return () => {
      clearInterval(checkModel);
      handRef.current?.stop();
      scene.stopAnimation();
      scene.dispose();
    };
  }, [stateManager]);

  const toggleHand = async () => {
    const caps = computeCapabilities(sharedState.consciousness.activeWindows);
    if (!caps.hasVision || caps.complete < 1) return;

    if (handOn) {
      handRef.current?.stop();
      handRef.current = null;
      setHandOn(false);
      setHandStatus('off');
      return;
    }
    setHandStatus('starting');
    const tracker = new HandTracker();
    const ok = await tracker.start();
    if (ok) {
      handRef.current = tracker;
      setHandOn(true);
      setHandStatus('on');
    } else {
      setHandStatus('error');
    }
  };

  const caps = computeCapabilities(sharedState.consciousness.activeWindows);
  const grabbed = hud.mode === 'holding cursor';
  const handAllowed = caps.hasVision && caps.complete >= 1;

  return (
    <SubsystemShell
      accent="cyan"
      role="Somatic Core"
      title="BODY"
      description={
        <>
          The humanoid lives here. Open all <strong>six panes</strong> for full speed and capture. With{' '}
          <strong>Vision</strong> it chases your cursor across the desktop — when you&apos;re outside this window it
          runs to the edge, pushes the tab toward you, then <strong>lunges to grab</strong> once you enter.
        </>
      }
      headerRight={
        <>
          <StatusChip label="Consciousness" value={`${hud.level}/6`} accent="cyan" />
          <Pill tone={caps.complete >= 1 ? 'ok' : caps.level >= 3 ? 'neutral' : 'warn'}>
            {sharedState.consciousness.description}
          </Pill>
          {handAllowed && (
            <button
              type="button"
              onClick={toggleHand}
              className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset backdrop-blur-sm transition ${
                handStatus === 'on'
                  ? 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/30'
                  : 'bg-fuchsia-500/10 text-fuchsia-100 ring-fuchsia-400/25 hover:bg-fuchsia-500/20'
              }`}
            >
              {handStatus === 'starting' ? 'Starting…' : handOn ? 'Hand ON' : 'Hand tracking'}
            </button>
          )}
        </>
      }
      badges={
        caps.missing.length > 0 ? (
          <>
            {caps.missing.map((m) => (
              <Pill key={m} tone="warn">
                Missing {subsystemLabel(m)}
              </Pill>
            ))}
          </>
        ) : undefined
      }
      consciousnessLevel={sharedState.consciousness.level}
      activeWindows={sharedState.consciousness.activeWindows}
      footer={
        <>
          {hud.mode} · {hud.hint} · Jump {hud.jump}% · Edges {hud.walls}% · Catches {hud.grabs}
          {handStatus === 'error' && ' · Webcam unavailable'}
        </>
      }
    >
      <ViewportFrame accent="cyan" label="Somatic viewport · 3D pursuit field">
        <div
          ref={containerRef}
          className={`relative h-full min-h-[280px] w-full overflow-hidden ${grabbed ? 'cursor-none' : 'cursor-default'}`}
        >
        {!modelReady && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="animate-pulse font-mono text-sm text-cyan-300/80">Loading humanoid…</div>
          </div>
        )}
        {caps.targetWeight < 0.05 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <p className="max-w-sm rounded-2xl bg-black/50 px-5 py-4 text-center text-xs text-slate-200/90 ring-1 ring-white/10 backdrop-blur-md">
              No sight — open <strong>Vision</strong>, then move your mouse on any pane or the launcher
            </p>
          </div>
        )}
        {grabbed && (
          <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 rounded-full bg-fuchsia-500/20 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-100 ring-1 ring-fuchsia-400/40 backdrop-blur-md">
            Caught you — releasing soon…
          </div>
        )}
        {hud.mode === 'pushing window toward you' && hud.cursorInPane && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-cyan-500/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100 ring-1 ring-cyan-400/30 backdrop-blur-md">
            Cursor in range — lunging…
          </div>
        )}
        </div>
      </ViewportFrame>
    </SubsystemShell>
  );
}
