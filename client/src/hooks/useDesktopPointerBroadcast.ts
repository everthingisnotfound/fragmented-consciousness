import { useEffect } from 'react';
import type { SharedStateManager } from '@/lib/sharedState';

/** Share screen-space cursor position so Body can chase across all open panes + launcher. */
export function useDesktopPointerBroadcast(manager: SharedStateManager) {
  useEffect(() => {
    let lastAt = 0;

    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastAt < 32) return;
      lastAt = now;

      manager.updateSignal('desktopPointer', {
        x: e.screenX,
        y: e.screenY,
        strength: 1,
        timestamp: now,
      });
    };

    // document captures moves anywhere in this browser window (tab or popup)
    document.addEventListener('mousemove', onMove, { passive: true });
    return () => document.removeEventListener('mousemove', onMove);
  }, [manager]);
}
