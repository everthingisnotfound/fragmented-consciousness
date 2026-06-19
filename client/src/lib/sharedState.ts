/**
 * Shared State Engine for Fragmented Consciousness
 *
 * Each browser window publishes a small presence heartbeat containing its
 * desktop bounds. Every window can then derive the same active-window list and
 * overlap/coupling map without needing a central server.
 */

export type WindowType = 'body' | 'vision' | 'memory' | 'touch' | 'hearing' | 'emotion';

export type EmotionalState = 'curious' | 'happy' | 'fearful' | 'excited' | 'calm';

export type CreatureState = 'exploring' | 'resting' | 'fleeing' | 'learning';

export type ArrangementState = 'fragmented' | 'edge-linked' | 'coupled' | 'merged';

export interface Creature {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  state: CreatureState;
  emotionalState: EmotionalState;
  energy: number;
  heading: number;
}

export interface Path {
  points: Array<{ x: number; y: number; z: number }>;
  type: 'safe' | 'exploration' | 'collision' | 'danger';
  timestamp: number;
}

export interface Collision {
  position: { x: number; y: number; z: number };
  objectId: string;
  timestamp: number;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface WindowPresence {
  id: string;
  type: WindowType;
  bounds: WindowBounds;
  focused: boolean;
  lastSeen: number;
}

export interface OverlapPair {
  a: WindowType;
  b: WindowType;
  area: number;
  strength: number;
}

export interface SensorSignal {
  x: number;
  y: number;
  strength: number;
  timestamp: number;
}

export interface SharedState {
  creature: Creature;
  consciousness: {
    activeWindows: WindowType[];
    level: number;
    description: string;
    windows: Partial<Record<WindowType, WindowPresence>>;
    overlapPairs: OverlapPair[];
    coupledWindows: WindowType[];
    coupling: number;
    arrangement: ArrangementState;
  };
  sensorium: {
    visionTarget: SensorSignal | null;
    touchPulse: SensorSignal | null;
    soundPulse: SensorSignal | null;
    /** Screen coordinates (x = screenX, y = screenY) from whichever pane has the cursor. */
    desktopPointer: SensorSignal | null;
  };
  memory: {
    paths: Path[];
    collisions: Collision[];
  };
  environment: {
    obstacles: Array<{ x: number; y: number; z: number; radius: number }>;
    targets: Array<{ x: number; y: number; z: number; type: string }>;
  };
  timestamp: number;
}

type SensorKey = keyof SharedState['sensorium'];

type ChannelMessage =
  | { type: 'PRESENCE'; sourceId: string; presence: WindowPresence }
  | { type: 'WINDOW_CLOSED'; sourceId: string }
  | { type: 'CREATURE_UPDATE'; sourceId: string; creature: Creature; timestamp: number }
  | { type: 'MEMORY_UPDATE'; sourceId: string; memory: SharedState['memory']; timestamp: number }
  | { type: 'ENVIRONMENT_UPDATE'; sourceId: string; environment: SharedState['environment']; timestamp: number }
  | { type: 'SENSORIUM_UPDATE'; sourceId: string; key: SensorKey; value: SensorSignal | null; timestamp: number };

const WINDOW_TYPES: WindowType[] = ['body', 'vision', 'memory', 'touch', 'hearing', 'emotion'];
const HEARTBEAT_MS = 350;
const PRESENCE_TTL_MS = 1800;

const CONSCIOUSNESS_DESCRIPTIONS: Record<number, string> = {
  0: 'Dormant',
  1: 'Instinct Only',
  2: 'Primitive',
  3: 'Confused',
  4: 'Noticeably Impaired',
  5: 'Minor Cognitive Loss',
  6: 'Fully Conscious',
};

const DEFAULT_STATE: SharedState = {
  creature: {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    state: 'exploring',
    emotionalState: 'curious',
    energy: 100,
    heading: 0,
  },
  consciousness: {
    activeWindows: [],
    level: 0,
    description: 'Dormant',
    windows: {},
    overlapPairs: [],
    coupledWindows: [],
    coupling: 0,
    arrangement: 'fragmented',
  },
  sensorium: {
    visionTarget: null,
    touchPulse: null,
    soundPulse: null,
    desktopPointer: null,
  },
  memory: {
    paths: [],
    collisions: [],
  },
  environment: {
    obstacles: [],
    targets: [],
  },
  timestamp: Date.now(),
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getWindowBounds(): WindowBounds {
  const width = Math.max(320, Math.round(window.outerWidth || window.innerWidth || 320));
  const height = Math.max(240, Math.round(window.outerHeight || window.innerHeight || 240));
  const x = Math.round(window.screenLeft ?? window.screenX ?? 0);
  const y = Math.round(window.screenTop ?? window.screenY ?? 0);

  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  };
}

function getIntersectionArea(a: WindowBounds, b: WindowBounds): number {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function getArrangement(coupling: number, pairCount: number): ArrangementState {
  if (pairCount === 0) return 'fragmented';
  if (coupling < 0.3) return 'edge-linked';
  if (coupling < 0.65) return 'coupled';
  return 'merged';
}

export class SharedStateManager {
  private state: SharedState;
  private snapshot: SharedState;
  private channel: BroadcastChannel;
  private listeners: Set<(state: SharedState) => void> = new Set();
  private changeListeners: Set<() => void> = new Set();
  private windowId: string;
  private lastNotifyAt = 0;
  private currentWindow: WindowType | null = null;
  private presences: Map<string, WindowPresence> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private unloadHandler: (() => void) | null = null;
  private boundsHandler: (() => void) | null = null;

  constructor(windowType?: WindowType) {
    this.windowId = `window_${Math.random().toString(36).slice(2, 11)}`;
    this.state = clone(DEFAULT_STATE);
    this.snapshot = clone(DEFAULT_STATE);
    this.channel = new BroadcastChannel('fragmented-consciousness');
    this.channel.onmessage = (event) => this.handleMessage(event.data as ChannelMessage);

    this.cleanupTimer = setInterval(() => this.recomputeConsciousness(), HEARTBEAT_MS * 2);

    if (windowType) {
      this.attachWindow(windowType);
    }
  }

  attachWindow(windowType: WindowType) {
    this.currentWindow = windowType;
    this.refreshLocalPresence();
    this.broadcastPresence();

    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        this.refreshLocalPresence();
        this.broadcastPresence();
      }, HEARTBEAT_MS);
    }

    if (!this.boundsHandler) {
      this.boundsHandler = () => {
        this.refreshLocalPresence();
        this.broadcastPresence();
      };
      window.addEventListener('resize', this.boundsHandler);
      window.addEventListener('focus', this.boundsHandler);
      window.addEventListener('blur', this.boundsHandler);
    }

    if (!this.unloadHandler) {
      this.unloadHandler = () => this.broadcast({ type: 'WINDOW_CLOSED', sourceId: this.windowId });
      window.addEventListener('pagehide', this.unloadHandler);
      window.addEventListener('beforeunload', this.unloadHandler);
    }
  }

  private refreshLocalPresence() {
    if (!this.currentWindow) return;

    const presence: WindowPresence = {
      id: this.windowId,
      type: this.currentWindow,
      bounds: getWindowBounds(),
      focused: document.hasFocus(),
      lastSeen: Date.now(),
    };

    this.presences.set(this.windowId, presence);
    this.recomputeConsciousness();
  }

  private broadcastPresence() {
    const presence = this.presences.get(this.windowId);
    if (!presence) return;
    this.broadcast({ type: 'PRESENCE', sourceId: this.windowId, presence });
  }

  private handleMessage(data: ChannelMessage) {
    if (!data || data.sourceId === this.windowId) return;

    switch (data.type) {
      case 'PRESENCE':
        this.presences.set(data.sourceId, data.presence);
        this.recomputeConsciousness();
        break;
      case 'WINDOW_CLOSED':
        this.presences.delete(data.sourceId);
        this.recomputeConsciousness();
        break;
      case 'CREATURE_UPDATE':
        this.state.creature = clone(data.creature);
        this.state.timestamp = data.timestamp;
        this.notifyListeners();
        break;
      case 'MEMORY_UPDATE':
        this.state.memory = clone(data.memory);
        this.state.timestamp = data.timestamp;
        this.notifyListeners();
        break;
      case 'ENVIRONMENT_UPDATE':
        this.state.environment = clone(data.environment);
        this.state.timestamp = data.timestamp;
        this.notifyListeners();
        break;
      case 'SENSORIUM_UPDATE':
        this.state.sensorium[data.key] = data.value ? clone(data.value) : null;
        this.state.timestamp = data.timestamp;
        this.notifyListeners();
        break;
      default:
        break;
    }
  }

  private broadcast(message: ChannelMessage) {
    this.channel.postMessage(message);
  }

  private refreshSnapshot() {
    this.snapshot = clone(this.state);
  }

  private notifyListeners(force = false) {
    const now = Date.now();
    if (!force && now - this.lastNotifyAt < 120) return;
    this.lastNotifyAt = now;
    this.refreshSnapshot();
    this.listeners.forEach((listener) => listener(this.snapshot));
    this.changeListeners.forEach((listener) => listener());
  }

  private recomputeConsciousness() {
    const now = Date.now();

    Array.from(this.presences.entries()).forEach(([id, presence]) => {
      if (id !== this.windowId && now - presence.lastSeen > PRESENCE_TTL_MS) {
        this.presences.delete(id);
      }
    });

    const windows: Partial<Record<WindowType, WindowPresence>> = {};

    this.presences.forEach((presence) => {
      const existing = windows[presence.type];
      if (!existing || presence.lastSeen > existing.lastSeen) {
        windows[presence.type] = presence;
      }
    });

    const activeWindows = WINDOW_TYPES.filter((type) => Boolean(windows[type]));
    const activePresences = activeWindows
      .map((type) => windows[type])
      .filter((presence): presence is WindowPresence => Boolean(presence));
    const overlapPairs: OverlapPair[] = [];
    const coupled = new Set<WindowType>();

    for (let i = 0; i < activePresences.length; i += 1) {
      for (let j = i + 1; j < activePresences.length; j += 1) {
        const first = activePresences[i];
        const second = activePresences[j];
        const area = getIntersectionArea(first.bounds, second.bounds);
        const smallerArea = Math.min(
          first.bounds.width * first.bounds.height,
          second.bounds.width * second.bounds.height,
        );
        const strength = smallerArea > 0 ? clamp01(area / smallerArea) : 0;

        if (area > 4000 && strength > 0.02) {
          overlapPairs.push({
            a: first.type,
            b: second.type,
            area: Math.round(area),
            strength: Number(strength.toFixed(3)),
          });
          coupled.add(first.type);
          coupled.add(second.type);
        }
      }
    }

    const possiblePairs = Math.max(1, (activeWindows.length * (activeWindows.length - 1)) / 2);
    const maxStrength = overlapPairs.reduce((max, pair) => Math.max(max, pair.strength), 0);
    const pairCoverage = overlapPairs.length / possiblePairs;
    const coupling = clamp01(maxStrength * 0.72 + pairCoverage * 0.28);
    const level = activeWindows.length;

    this.state.consciousness = {
      activeWindows,
      level,
      description: CONSCIOUSNESS_DESCRIPTIONS[level] || 'Unknown',
      windows,
      overlapPairs,
      coupledWindows: WINDOW_TYPES.filter((type) => coupled.has(type)),
      coupling: Number(coupling.toFixed(3)),
      arrangement: getArrangement(coupling, overlapPairs.length),
    };
    this.state.timestamp = now;
    this.notifyListeners(true);
  }

  subscribe(listener: (state: SharedState) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  subscribeChanges(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  getSnapshot(): SharedState {
    return this.snapshot;
  }

  getState(): SharedState {
    return clone(this.state);
  }

  updateCreature(updates: Partial<Creature>) {
    this.state.creature = clone({ ...this.state.creature, ...updates });
    this.state.timestamp = Date.now();
    this.broadcast({
      type: 'CREATURE_UPDATE',
      sourceId: this.windowId,
      creature: this.state.creature,
      timestamp: this.state.timestamp,
    });
    this.notifyListeners();
  }

  updateConsciousness() {
    this.recomputeConsciousness();
  }

  updateSignal(key: SensorKey, value: SensorSignal | null) {
    this.state.sensorium[key] = value ? clone(value) : null;
    this.state.timestamp = Date.now();
    this.broadcast({
      type: 'SENSORIUM_UPDATE',
      sourceId: this.windowId,
      key,
      value: this.state.sensorium[key],
      timestamp: this.state.timestamp,
    });
    this.notifyListeners();
  }

  addPath(path: Path) {
    this.state.memory.paths = this.state.memory.paths.concat(clone(path)).slice(-160);
    this.state.timestamp = Date.now();
    this.broadcast({
      type: 'MEMORY_UPDATE',
      sourceId: this.windowId,
      memory: this.state.memory,
      timestamp: this.state.timestamp,
    });
    this.notifyListeners();
  }

  addCollision(collision: Collision) {
    this.state.memory.collisions = this.state.memory.collisions.concat(clone(collision)).slice(-80);
    this.state.timestamp = Date.now();
    this.broadcast({
      type: 'MEMORY_UPDATE',
      sourceId: this.windowId,
      memory: this.state.memory,
      timestamp: this.state.timestamp,
    });
    this.notifyListeners();
  }

  clearMemory() {
    this.state.memory = { paths: [], collisions: [] };
    this.state.timestamp = Date.now();
    this.broadcast({
      type: 'MEMORY_UPDATE',
      sourceId: this.windowId,
      memory: this.state.memory,
      timestamp: this.state.timestamp,
    });
    this.notifyListeners();
  }

  setEnvironment(obstacles: SharedState['environment']['obstacles'], targets: SharedState['environment']['targets']) {
    this.state.environment = { obstacles: clone(obstacles), targets: clone(targets) };
    this.state.timestamp = Date.now();
    this.broadcast({
      type: 'ENVIRONMENT_UPDATE',
      sourceId: this.windowId,
      environment: this.state.environment,
      timestamp: this.state.timestamp,
    });
    this.notifyListeners();
  }

  getConsciousnessLevel(): number {
    return this.state.consciousness.level;
  }

  getCoupling(): number {
    return this.state.consciousness.coupling;
  }

  getActiveWindows(): WindowType[] {
    return this.state.consciousness.activeWindows;
  }

  getConsciousnessDescription(): string {
    return this.state.consciousness.description;
  }

  dispose() {
    this.broadcast({ type: 'WINDOW_CLOSED', sourceId: this.windowId });
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.boundsHandler) {
      window.removeEventListener('resize', this.boundsHandler);
      window.removeEventListener('focus', this.boundsHandler);
      window.removeEventListener('blur', this.boundsHandler);
    }
    if (this.unloadHandler) {
      window.removeEventListener('pagehide', this.unloadHandler);
      window.removeEventListener('beforeunload', this.unloadHandler);
    }
    this.channel.close();
    this.listeners.clear();
    this.changeListeners.clear();
    this.presences.clear();
  }
}

let globalStateManager: SharedStateManager | null = null;

export function initializeSharedState(windowType?: WindowType): SharedStateManager {
  if (!globalStateManager) {
    globalStateManager = new SharedStateManager(windowType);
  } else if (windowType) {
    globalStateManager.attachWindow(windowType);
  }
  return globalStateManager;
}

export function getSharedState(): SharedStateManager {
  if (!globalStateManager) {
    globalStateManager = new SharedStateManager();
  }
  return globalStateManager;
}
