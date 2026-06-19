/**
 * Lightweight optional hand tracking via MediaPipe (index fingertip → screen target).
 * Runs at reduced FPS to avoid overloading the laptop.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export interface HandScreenPoint {
  x: number;
  y: number;
  active: boolean;
}

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private running = false;
  private lastFrame = 0;
  private intervalMs = 80; // ~12 fps
  private lastPoint: HandScreenPoint = { x: 0, y: 0, active: false };

  async start(): Promise<boolean> {
    if (this.running) return true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
      );

      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.playsInline = true;
      this.video.muted = true;
      await this.video.play();

      this.running = true;
      return true;
    } catch (err) {
      console.warn('[HandTracker] unavailable:', err);
      this.stop();
      return false;
    }
  }

  /** Map fingertip to desktop coords using this window's screen position. */
  sample(): HandScreenPoint {
    if (!this.running || !this.landmarker || !this.video) return this.lastPoint;

    const now = performance.now();
    if (now - this.lastFrame < this.intervalMs) return this.lastPoint;
    this.lastFrame = now;

    const result = this.landmarker.detectForVideo(this.video, now);
    if (!result.landmarks.length) {
      this.lastPoint = { ...this.lastPoint, active: false };
      return this.lastPoint;
    }

    const tip = result.landmarks[0][8]; // index finger tip
    const sx = window.screenLeft ?? window.screenX ?? 0;
    const sy = window.screenTop ?? window.screenY ?? 0;

    // Mirror X so moving hand right moves target right on screen
    this.lastPoint = {
      x: sx + (1 - tip.x) * window.innerWidth,
      y: sy + tip.y * window.innerHeight,
      active: true,
    };
    return this.lastPoint;
  }

  stop() {
    this.running = false;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video = null;
    this.landmarker?.close();
    this.landmarker = null;
    this.lastPoint = { x: 0, y: 0, active: false };
  }

  isRunning() {
    return this.running;
  }
}
