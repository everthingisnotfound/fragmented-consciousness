/**
 * Multi-window desktop Three.js scene.
 * Global desktop coords + per-window camera so the figure stays visible.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { WindowRecord } from '@/lib/WindowManager';
import type { DesktopWorldState } from '@/lib/worldState';

const MODEL_PATH = `${import.meta.env.BASE_URL}models/cesium-man.glb`.replace(/\/{2,}/g, '/');

const TYPE_COLORS: Record<string, number> = {
  body: 0x16f4ff,
  vision: 0x38bdf8,
  memory: 0x78ff6a,
  touch: 0xff2df8,
  hearing: 0xffb347,
  emotion: 0xff6ad5,
};

function getScreenPos() {
  return {
    x: window.screenLeft ?? window.screenX ?? 0,
    y: window.screenTop ?? window.screenY ?? 0,
  };
}

export class MultiWindowScene {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  world: THREE.Object3D;
  container: HTMLElement;

  private sceneOffset = { x: 0, y: 0 };
  private sceneOffsetTarget = { x: 0, y: 0 };
  private frameObjects: THREE.Object3D[] = [];
  private creatureGroup: THREE.Group;
  private creatureMixer: THREE.AnimationMixer | null = null;
  private creatureMaterials: THREE.MeshStandardMaterial[] = [];
  private placeholder: THREE.Group | null = null;
  private mistakeGroup = new THREE.Group();
  private targetMarker: THREE.Mesh;
  private animationId: number | null = null;
  private clock = new THREE.Clock();
  private onResize: () => void;
  private thisWindowId = -1;

  constructor(container: HTMLElement) {
    this.container = container;
    const w = Math.max(container.clientWidth, 320);
    const h = Math.max(container.clientHeight, 240);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040812);
    this.scene.fog = new THREE.Fog(0x040812, 40, 120);

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
    this.camera.position.set(0, 1.6, 5.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.world = new THREE.Object3D();
    this.scene.add(this.world);
    this.world.add(this.mistakeGroup);

    const hemi = new THREE.HemisphereLight(0x7ecbff, 0x120820, 1.3);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 8, 5);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x16f4ff, 2, 20);
    rim.position.set(-2, 3, 3);
    this.scene.add(rim);

    // Floor grid in local space (moves with world offset)
    const grid = new THREE.GridHelper(40, 40, 0x16f4ff, 0x1a3050);
    grid.position.y = 0;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    this.world.add(grid);

    this.creatureGroup = new THREE.Group();
    this.world.add(this.creatureGroup);
    this.placeholder = this.buildPlaceholder();
    this.creatureGroup.add(this.placeholder);
    this.loadHumanoid();

    this.targetMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.22, 32),
      new THREE.MeshBasicMaterial({ color: 0xff2df8, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
    );
    this.targetMarker.rotation.x = -Math.PI / 2;
    this.targetMarker.visible = false;
    this.world.add(this.targetMarker);

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
  }

  setThisWindowId(id: number) {
    this.thisWindowId = id;
  }

  private buildPlaceholder(): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3de8ff,
      emissive: 0x0a6080,
      emissiveIntensity: 0.65,
      metalness: 0.35,
      roughness: 0.4,
    });
    this.creatureMaterials.push(mat);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 8, 16), mat);
    torso.position.y = 1.05;
    g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), mat);
    head.position.y = 1.75;
    g.add(head);
    const limbGeo = new THREE.CapsuleGeometry(0.1, 0.75, 6, 12);
    [[-0.42, 1.1, 0], [0.42, 1.1, 0], [-0.18, 0.45, 0], [0.18, 0.45, 0]].forEach(([x, y, z]) => {
      const limb = new THREE.Mesh(limbGeo, mat);
      limb.position.set(x, y, z);
      g.add(limb);
    });
    return g;
  }

  private loadHumanoid() {
    const loader = new GLTFLoader();
    loader.load(
      MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const height = Math.max(box.getSize(new THREE.Vector3()).y, 0.01);
        const scale = 1.75 / height;
        model.scale.setScalar(scale);
        model.position.set(-box.getCenter(new THREE.Vector3()).x * scale, -box.min.y * scale, 0);

        model.traverse((child) => {
          if (child instanceof THREE.SkinnedMesh) {
            child.frustumCulled = false;
            this.applyMat(child);
          } else if (child instanceof THREE.Mesh) {
            this.applyMat(child);
          }
        });

        if (gltf.animations.length) {
          this.creatureMixer = new THREE.AnimationMixer(model);
          this.creatureMixer.clipAction(gltf.animations[0]).play();
        }

        if (this.placeholder) {
          this.creatureGroup.remove(this.placeholder);
          this.placeholder = null;
        }
        this.creatureGroup.add(model);
      },
      undefined,
      (e) => console.warn('[MultiWindowScene] model load failed', e),
    );
  }

  private applyMat(mesh: THREE.Mesh) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mesh.material = mats.map((mat) => {
      const m = mat.clone();
      if (m instanceof THREE.MeshStandardMaterial) {
        m.emissive = new THREE.Color(0x0c3048);
        m.emissiveIntensity = 0.45;
        this.creatureMaterials.push(m);
      }
      return m;
    }) as THREE.Material | THREE.Material[];
  }

  /** bgstaal offset: shift world so desktop coords map into this window. */
  updateWindowShape(easing = true) {
    const sp = getScreenPos();
    this.sceneOffsetTarget = { x: -sp.x, y: -sp.y };
    if (!easing) this.sceneOffset = { ...this.sceneOffsetTarget };
  }

  /** Thin borders only for *other* windows — no filled boxes. */
  syncWindowFrames(windows: WindowRecord[]) {
    this.frameObjects.forEach((o) => this.world.remove(o));
    this.frameObjects = [];

    windows.forEach((win) => {
      if (win.id === this.thisWindowId) return;

      const type = win.metaData?.type || 'body';
      const color = TYPE_COLORS[type] ?? 0x16f4ff;
      const w = win.shape.w;
      const h = win.shape.h;
      const cx = win.shape.x + w / 2;
      const cy = win.shape.y + h / 2;

      const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 }),
      );
      border.position.set(cx, cy, -1);
      this.world.add(border);
      this.frameObjects.push(border);
    });
  }

  syncMistakes(mistakes: DesktopWorldState['mistakes']) {
    while (this.mistakeGroup.children.length) {
      this.mistakeGroup.remove(this.mistakeGroup.children[0]);
    }
    const now = Date.now();

    mistakes.slice(-24).forEach((m) => {
      if (now - m.t > 120_000) return;
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.35, 16),
        new THREE.MeshBasicMaterial({ color: 0xff3f6e, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(m.x, 0.05, m.y);
      this.mistakeGroup.add(dot);
    });
  }

  /** Desktop (screen) coords → 3D world on the floor plane. */
  setCreatureDesktopPosition(screenX: number, screenY: number) {
    this.creatureGroup.position.set(screenX, 0, screenY);
  }

  setTargetDesktopPosition(screenX: number, screenY: number, visible: boolean) {
    this.targetMarker.visible = visible;
    this.targetMarker.position.set(screenX, 0.06, screenY);
  }

  /** Keep perspective camera aimed at the figure in this window's view. */
  followCreature() {
    const sp = getScreenPos();
    const cx = this.creatureGroup.position.x;
    const cy = this.creatureGroup.position.z;
    const localX = cx - sp.x - window.innerWidth / 2;
    const localZ = cy - sp.y - window.innerHeight / 2;

    const scale = 0.0028;
    this.camera.position.x += (localX * scale - this.camera.position.x) * 0.06;
    this.camera.position.z += (5.5 + localZ * scale * 0.3 - this.camera.position.z) * 0.04;
    this.camera.lookAt(localX * scale, 1.1, localZ * scale);
  }

  pulseCreature(source: DesktopWorldState['targetSource']) {
    const boost = source === 'hand' ? 0.85 : 0.45;
    this.creatureMaterials.forEach((m) => {
      m.emissiveIntensity = 0.35 + boost;
    });
  }

  animate(tick?: () => void) {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop);
      const falloff = 0.1;
      this.sceneOffset.x += (this.sceneOffsetTarget.x - this.sceneOffset.x) * falloff;
      this.sceneOffset.y += (this.sceneOffsetTarget.y - this.sceneOffset.y) * falloff;
      this.world.position.set(this.sceneOffset.x, 0, this.sceneOffset.y);

      this.creatureMixer?.update(this.clock.getDelta());
      this.followCreature();
      if (tick) tick();
      this.renderer.render(this.scene, this.camera);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  resize() {
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export function createMultiWindowScene(container: HTMLElement) {
  return new MultiWindowScene(container);
}
