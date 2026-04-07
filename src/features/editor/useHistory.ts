import { useRef, useState, useCallback } from 'react';
import type { ProjectState, RawImage } from '../../types';
import { type Snapshot, MAX_HISTORY, toSnapshot, fromSnapshot } from './historyStore';
import type { ImageId } from './historyStore';

export function useHistory(initialState: ProjectState, initialImage: RawImage | null = null) {
  const initStore = new Map<ImageId, RawImage>();
  const initOrder: ImageId[] = [];
  const initPast: Snapshot[] = [];
  const store = useRef(initStore);
  const order = useRef(initOrder);
  const past = useRef(initPast);
  const future = useRef<Snapshot[]>([]);
  const present = useRef<Snapshot>(toSnapshot(initialState, initialImage, initStore, initOrder, initPast, null));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const push = useCallback((state: ProjectState, image: RawImage | null) => {
    const snap = toSnapshot(
      state, image,
      store.current,
      order.current,
      past.current,
      present.current.imageId
    );
    const next = [...past.current, present.current];
    past.current = next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    present.current = snap;
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const undo = useCallback((): { state: ProjectState; image: RawImage | null } | null => {
    if (!past.current.length) return null;
    const prev = past.current[past.current.length - 1];
    future.current = [present.current, ...future.current];
    past.current = past.current.slice(0, -1);
    present.current = prev;
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
    return fromSnapshot(prev, store.current);
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const redo = useCallback((): { state: ProjectState; image: RawImage | null } | null => {
    if (!future.current.length) return null;
    const next = future.current[0];
    past.current = [...past.current, present.current];
    future.current = future.current.slice(1);
    present.current = next;
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
    return fromSnapshot(next, store.current);
  }, []);

  return { push, undo, redo, canUndo, canRedo };
}
