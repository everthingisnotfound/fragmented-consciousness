/**
 * Three.js scene — Khronos CesiumMan humanoid (glTF), sci-fi environment.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { PlayBounds } from '@/lib/playSpace';

export interface SceneConfig {
  container: HTMLElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
}

const MODEL_PATH = `${import.meta.env.BASE_URL}models/cesium-man.glb`.replace(/\/{2,}/g, '/');

export class ThreeScene {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  container: HTMLElement;
  animationId: number | null = null;
  clock: THREE.Clock;
  resizeHandler: () => void;

  ambientLight: THREE.HemisphereLight;
  directionalLight: THREE.DirectionalLight;
  characterLight: THREE.PointLight;

  particleSystem: THREE.Points | null = null;
  creature: THREE.Group | null = null;
  modelRoot: THREE.Group | null = null;
  placeholder: THREE.Group | null = null;

  private creatureMixer: THREE.AnimationMixer | null = null;
  private creatureMaterials: THREE.MeshStandardMaterial[] = [];
  private grabRing: THREE.Mesh | null = null;
  private floorGrid: THREE.GridHelper | null = null;
  private cursorHint: THREE.Mesh | null = null;
  private playBounds: PlayBounds | null = null;
  private cameraFocus = { x: 0, z: 0 };
  private creatureCharge = 0;
  modelLoaded = false;

  constructor(config: SceneConfig) {
    this.container = config.container;
    const width = config.width || this.container.clientWidth;
    const height = config.height || this.container.clientHeight;
    const pixelRatio = Math.min(config.pixelRatio || window.devicePixelRatio, 2);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x061018, 40, 120);

    this.camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 200);
    this.camera.position.set(0, 14, 0);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.ambientLight = new THREE.HemisphereLight(0x7ecbff, 0x1a1030, 1.1);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
    this.directionalLight.position.set(4, 10, 6);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(this.directionalLight);

    this.characterLight = new THREE.PointLight(0x16f4ff, 2.5, 12);
    this.characterLight.position.set(0, 2.5, 2);
    this.scene.add(this.characterLight);

    this.createGradientSky();
    this.createParticles();

    this.resizeHandler = () => this.onWindowResize();
    window.addEventListener('resize', this.resizeHandler);
  }

  private createGradientSky() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#0a2040');
    gradient.addColorStop(0.55, '#060816');
    gradient.addColorStop(1, '#1a0835');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    this.scene.background = new THREE.CanvasTexture(canvas);
  }

  private createParticles() {
    const particleCount = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 50;
      positions[i + 1] = Math.random() * 25;
      positions[i + 2] = (Math.random() - 0.5) * 50;
      velocities[i] = (Math.random() - 0.5) * 0.015;
      velocities[i + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i + 2] = (Math.random() - 0.5) * 0.015;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData.velocities = velocities;

    this.particleSystem = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0x55f7ff, size: 0.15, transparent: true, opacity: 0.4 }),
    );
    this.scene.add(this.particleSystem);
  }

  /** Resize floor + camera to match the tab's play bounds. */
  setPlayBounds(bounds: PlayBounds) {
    this.playBounds = bounds;

    if (this.floorGrid) {
      this.scene.remove(this.floorGrid);
      this.floorGrid.geometry.dispose();
      (this.floorGrid.material as THREE.Material).dispose();
    }

    const size = Math.max(bounds.renderWidth, bounds.renderDepth);
    this.floorGrid = new THREE.GridHelper(size, 16, 0x3de8ff, 0x1a2840);
    this.floorGrid.scale.set(bounds.renderWidth / size, 1, bounds.renderDepth / size);
    this.floorGrid.position.y = 0;
    (this.floorGrid.material as THREE.Material).transparent = true;
    (this.floorGrid.material as THREE.Material).opacity = 0.35;
    this.scene.add(this.floorGrid);

    const halfH = bounds.renderDepth * 0.54;
    const halfW = bounds.renderWidth * 0.54;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
    this.updateCameraFocus(0, 0);
  }

  /** Top-down camera tracks the creature so it never walks off-screen. */
  updateCameraFocus(renderX: number, renderZ: number) {
    if (!this.playBounds) return;
    const lerp = 0.12;
    this.cameraFocus.x += (renderX - this.cameraFocus.x) * lerp;
    this.cameraFocus.z += (renderZ - this.cameraFocus.z) * lerp;
    this.camera.position.set(this.cameraFocus.x, 14, this.cameraFocus.z);
    this.camera.lookAt(this.cameraFocus.x, 0, this.cameraFocus.z);
  }

  /** Glowing marker at the play-area edge pointing toward off-screen cursor. */
  setCursorHint(rawNx: number, rawNy: number, bounds: PlayBounds, visible: boolean) {
    if (!visible) {
      if (this.cursorHint) this.cursorHint.visible = false;
      return;
    }

    const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, rawNx));
    const clampedZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, rawNy));
    const rx = (clampedX - 0.5) * bounds.renderWidth;
    const rz = (clampedZ - 0.5) * bounds.renderDepth;

    if (!this.cursorHint) {
      this.cursorHint = new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.22, 24),
        new THREE.MeshBasicMaterial({ color: 0x5ecbff, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
      );
      this.cursorHint.rotation.x = -Math.PI / 2;
      this.scene.add(this.cursorHint);
    }

    this.cursorHint.visible = true;
    this.cursorHint.position.set(rx, 0.06, rz);
    this.cursorHint.scale.setScalar(1 + Math.sin(Date.now() * 0.006) * 0.12);
  }

  createCreature(): THREE.Group {
    const group = new THREE.Group();
    this.creatureMaterials = [];
    this.modelRoot = new THREE.Group();
    group.add(this.modelRoot);

    // Visible immediately while glTF loads
    this.placeholder = this.buildPlaceholderHumanoid();
    this.modelRoot.add(this.placeholder);
    this.modelLoaded = true;

    this.loadHumanoidModel(this.modelRoot);
    this.creature = group;
    this.scene.add(group);
    return group;
  }

  private applyHumanoidMaterials(material: THREE.Material | THREE.Material[]) {
    const mats = Array.isArray(material) ? material : [material];
    mats.forEach((mat) => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.metalness = 0.2;
        mat.roughness = 0.55;
        mat.emissive = new THREE.Color(0x0c3048);
        mat.emissiveIntensity = 0.35;
        this.creatureMaterials.push(mat);
      }
    });
  }

  /** Bright procedural stand-in — replaced once CesiumMan loads. */
  private buildPlaceholderHumanoid(): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3de8ff,
      emissive: 0x0a6080,
      emissiveIntensity: 0.55,
      metalness: 0.35,
      roughness: 0.4,
    });
    this.creatureMaterials.push(mat);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 8, 16), mat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    g.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), mat);
    head.position.y = 1.75;
    head.castShadow = true;
    g.add(head);

    const limbGeo = new THREE.CapsuleGeometry(0.1, 0.75, 6, 12);
    [[-0.42, 1.1, 0], [0.42, 1.1, 0], [-0.18, 0.45, 0], [0.18, 0.45, 0]].forEach(([x, y, z]) => {
      const limb = new THREE.Mesh(limbGeo, mat);
      limb.position.set(x, y, z);
      limb.castShadow = true;
      g.add(limb);
    });

    return g;
  }

  private loadHumanoidModel(parent: THREE.Group) {
    const loader = new GLTFLoader();

    loader.load(
      MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const height = Math.max(size.y, 0.01);
        const scale = 1.8 / height;

        model.scale.setScalar(scale);
        model.position.set(0, -box.min.y * scale, 0);

        model.traverse((child) => {
          if (child instanceof THREE.SkinnedMesh) {
            child.frustumCulled = false;
            child.castShadow = true;
            child.receiveShadow = true;
            this.applyHumanoidMaterials(child.material);
          } else if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            this.applyHumanoidMaterials(child.material);
          }
        });

        if (gltf.animations.length > 0) {
          this.creatureMixer = new THREE.AnimationMixer(model);
          const action = this.creatureMixer.clipAction(gltf.animations[0]);
          action.play();
        }

        if (this.placeholder) {
          parent.remove(this.placeholder);
          this.placeholder.traverse((c) => {
            if (c instanceof THREE.Mesh) {
              c.geometry.dispose();
            }
          });
          this.placeholder = null;
        }

        parent.add(model);
        this.modelLoaded = true;
        console.info('[Body] CesiumMan humanoid loaded');
      },
      undefined,
      (err) => {
        console.warn('[Body] glTF load failed, keeping placeholder humanoid:', err);
      },
    );
  }

  setCreatureCharge(charge: number, accent = 0x16f4ff) {
    this.creatureCharge = Math.max(0, Math.min(1, charge));
    const accentColor = new THREE.Color(accent);

    this.creatureMaterials.forEach((material) => {
      material.emissive.lerp(accentColor, 0.05);
      material.emissiveIntensity = 0.3 + this.creatureCharge * 0.55;
    });

    this.characterLight.intensity = 2 + this.creatureCharge * 2;
    this.characterLight.color.lerp(accentColor, 0.04);
  }

  followTarget(renderX: number, renderZ: number, y = 0) {
    this.characterLight.position.set(renderX, 2 + y, renderZ + 0.5);
  }

  setGrabbedVisual(grabbed: boolean, renderX = 0, renderZ = 0) {
    if (grabbed && !this.grabRing) {
      this.grabRing = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.75, 32),
        new THREE.MeshBasicMaterial({ color: 0xff2df8, transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
      );
      this.grabRing.rotation.x = -Math.PI / 2;
      this.scene.add(this.grabRing);
    }
    if (this.grabRing) {
      this.grabRing.visible = grabbed;
      if (grabbed) {
        this.grabRing.position.set(renderX, 0.08, renderZ);
        this.grabRing.scale.setScalar(1 + Math.sin(Date.now() * 0.01) * 0.15);
      }
    }
  }

  updateParticles() {
    if (!this.particleSystem) return;
    const positions = this.particleSystem.geometry.attributes.position.array as Float32Array;
    const velocities = this.particleSystem.geometry.userData.velocities as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];
      if (Math.abs(positions[i]) > 30) velocities[i] *= -1;
      if (positions[i + 1] < 0 || positions[i + 1] > 20) velocities[i + 1] *= -1;
      if (Math.abs(positions[i + 2]) > 30) velocities[i + 2] *= -1;
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  animate(callback?: (delta: number) => void) {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop);
      const delta = Math.min(this.clock.getDelta(), 0.05);
      this.updateParticles();
      this.creatureMixer?.update(delta);
      if (callback) callback(delta);
      this.renderer.render(this.scene, this.camera);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stopAnimation() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private onWindowResize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.renderer.setSize(width, height);
    if (this.playBounds) {
      this.setPlayBounds(this.playBounds);
    }
  }

  dispose() {
    this.stopAnimation();
    window.removeEventListener('resize', this.resizeHandler);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export function createThreeScene(container: HTMLElement): ThreeScene {
  return new ThreeScene({ container });
}
