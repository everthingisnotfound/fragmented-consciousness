/**
 * Map pointer positions between subsystem windows and the Body canvas using desktop screen coords.
 */

import type { WindowPresence } from '@/lib/sharedState';

export function paneNormToScreen(nx: number, ny: number, presence: WindowPresence) {
  return {
    screenX: presence.bounds.x + nx * presence.bounds.width,
    screenY: presence.bounds.y + ny * presence.bounds.height,
  };
}

/** Map a desktop screen point into Body canvas normalized coords (can be outside 0..1). */
export function screenToContainerNorm(
  screenX: number,
  screenY: number,
  container: HTMLElement,
) {
  const rect = container.getBoundingClientRect();
  const winX = window.screenLeft ?? window.screenX ?? 0;
  const winY = window.screenTop ?? window.screenY ?? 0;
  const left = winX + rect.left;
  const top = winY + rect.top;
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  return {
    rawNx: (screenX - left) / width,
    rawNy: (screenY - top) / height,
    screenX,
    screenY,
  };
}

/** Pure helper for tests — map screen point given explicit container screen rect. */
export function screenPointToNorm(
  screenX: number,
  screenY: number,
  containerScreenLeft: number,
  containerScreenTop: number,
  containerWidth: number,
  containerHeight: number,
) {
  const width = Math.max(1, containerWidth);
  const height = Math.max(1, containerHeight);
  return {
    rawNx: (screenX - containerScreenLeft) / width,
    rawNy: (screenY - containerScreenTop) / height,
  };
}

export function mapPaneNormToContainer(
  nx: number,
  ny: number,
  source: WindowPresence,
  container: HTMLElement,
) {
  const screen = paneNormToScreen(nx, ny, source);
  return screenToContainerNorm(screen.screenX, screen.screenY, container);
}

export function clientToContainerNorm(clientX: number, clientY: number, container: HTMLElement) {
  const rect = container.getBoundingClientRect();
  return {
    rawNx: (clientX - rect.left) / Math.max(1, rect.width),
    rawNy: (clientY - rect.top) / Math.max(1, rect.height),
  };
}

export function isInsideContainer(rawNx: number, rawNy: number) {
  return rawNx >= 0 && rawNx <= 1 && rawNy >= 0 && rawNy <= 1;
}
