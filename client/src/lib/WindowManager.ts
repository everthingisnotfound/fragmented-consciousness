/**
 * Multi-window desktop sync (bgstaal / multipleWindow3dScene pattern).
 */

export interface WinShape {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WindowMeta {
  type: string;
  label: string;
}

export interface WindowRecord {
  id: number;
  shape: WinShape;
  metaData: WindowMeta;
}

const STORAGE_KEY = 'fc-windows';
const COUNT_KEY = 'fc-window-count';

export class WindowManager {
  private windows: WindowRecord[] = [];
  private count = 0;
  private id = 0;
  private winData: WindowRecord | null = null;
  private shapeCallback: (() => void) | null = null;
  private listCallback: (() => void) | null = null;

  constructor() {
    addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      const next = JSON.parse(event.newValue) as WindowRecord[];
      const changed = this.didListChange(this.windows, next);
      this.windows = next;
      if (changed && this.listCallback) this.listCallback();
    });

    window.addEventListener('beforeunload', () => {
      const index = this.getWindowIndexFromId(this.id);
      if (index >= 0) {
        this.windows.splice(index, 1);
        this.persist();
      }
    });
  }

  init(metaData: WindowMeta) {
    this.windows = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    this.count = Number(localStorage.getItem(COUNT_KEY) || 0) + 1;
    this.id = this.count;

    const shape = this.getWinShape();
    this.winData = { id: this.id, shape, metaData };
    this.windows.push(this.winData);

    localStorage.setItem(COUNT_KEY, String(this.count));
    this.persist();
  }

  getWinShape(): WinShape {
    return {
      x: window.screenLeft ?? window.screenX ?? 0,
      y: window.screenTop ?? window.screenY ?? 0,
      w: window.innerWidth,
      h: window.innerHeight,
    };
  }

  update() {
    if (!this.winData) return;
    const shape = this.getWinShape();
    const prev = this.winData.shape;
    if (prev.x === shape.x && prev.y === shape.y && prev.w === shape.w && prev.h === shape.h) return;

    this.winData.shape = shape;
    const index = this.getWindowIndexFromId(this.id);
    if (index >= 0) this.windows[index].shape = shape;
    if (this.shapeCallback) this.shapeCallback();
    this.persist();
  }

  getWindows() {
    return this.windows;
  }

  getThisWindowData() {
    return this.winData;
  }

  getThisWindowID() {
    return this.id;
  }

  getWindowIndexFromId(wid: number) {
    return this.windows.findIndex((w) => w.id === wid);
  }

  setWinShapeChangeCallback(cb: () => void) {
    this.shapeCallback = cb;
  }

  setWinChangeCallback(cb: () => void) {
    this.listCallback = cb;
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.windows));
  }

  private didListChange(prev: WindowRecord[], next: WindowRecord[]) {
    if (prev.length !== next.length) return true;
    return prev.some((w, i) => w.id !== next[i]?.id);
  }
}

export function clearWindowRegistry() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(COUNT_KEY);
}
