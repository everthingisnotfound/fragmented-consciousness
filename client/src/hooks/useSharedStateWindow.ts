import { useRef, useSyncExternalStore } from 'react';
import {
  initializeSharedState,
  type SharedState,
  type SharedStateManager,
  type WindowType,
} from '@/lib/sharedState';

export function useSharedStateWindow(windowType: WindowType): {
  state: SharedState;
  manager: SharedStateManager;
} {
  const managerRef = useRef<SharedStateManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = initializeSharedState(windowType);
  }

  const manager = managerRef.current;

  const state = useSyncExternalStore(
    (onStoreChange) => manager.subscribeChanges(onStoreChange),
    () => manager.getSnapshot(),
    () => manager.getSnapshot(),
  );

  return { state, manager };
}
