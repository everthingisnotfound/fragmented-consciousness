import { useSyncExternalStore } from 'react';
import { getSharedState, type SharedState } from '@/lib/sharedState';

/** Read-only sync for Launcher / observers that don't register as a subsystem pane. */
export function useSharedStateSnapshot(): SharedState {
  const mgr = getSharedState();
  return useSyncExternalStore(
    (onStoreChange) => mgr.subscribeChanges(onStoreChange),
    () => mgr.getSnapshot(),
    () => mgr.getSnapshot(),
  );
}
