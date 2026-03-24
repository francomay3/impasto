import { useRef, useState } from 'react';
import type { ProjectState } from '../types';

const MAX_HISTORY = 50;
const MAX_IMAGES = 2;

type ImageId = string;
type Snapshot = Omit<ProjectState, 'imageDataUrl'> & { imageId: ImageId | null };

function addImage(
  store: Map<ImageId, string>,
  order: ImageId[],
  past: Snapshot[],
  url: string,
): ImageId {
  for (const [id, u] of store) if (u === url) return id;
  const id = crypto.randomUUID();
  store.set(id, url);
  order.push(id);
  if (order.length > MAX_IMAGES) {
    const evictId = order.shift()!;
    store.delete(evictId);
    let cut = -1;
    for (let i = past.length - 1; i >= 0; i--) {
      if (past[i].imageId === evictId) { cut = i; break; }
    }
    if (cut >= 0) past.splice(0, cut + 1);
  }
  return id;
}

function toSnapshot(
  state: ProjectState,
  store: Map<ImageId, string>,
  order: ImageId[],
  past: Snapshot[],
  prevImageId: ImageId | null,
): Snapshot {
  const { imageDataUrl, ...rest } = state;
  if (!imageDataUrl) return { ...rest, imageId: null };
  if (prevImageId && store.get(prevImageId) === imageDataUrl) return { ...rest, imageId: prevImageId };
  return { ...rest, imageId: addImage(store, order, past, imageDataUrl) };
}

function fromSnapshot(snapshot: Snapshot, store: Map<ImageId, string>): ProjectState {
  const { imageId, ...rest } = snapshot;
  return { ...rest, imageDataUrl: imageId ? (store.get(imageId) ?? null) : null };
}

export function useHistory(initialState: ProjectState) {
  const initStore = new Map<ImageId, string>();
  const initOrder: ImageId[] = [];
  const initPast: Snapshot[] = [];
  const store = useRef(initStore);
  const order = useRef(initOrder);
  const past = useRef(initPast);
  const future = useRef<Snapshot[]>([]);
  const present = useRef<Snapshot>(toSnapshot(initialState, initStore, initOrder, initPast, null));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  function push(state: ProjectState) {
    const snap = toSnapshot(state, store.current, order.current, past.current, present.current.imageId);
    const next = [...past.current, present.current];
    past.current = next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    present.current = snap;
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }

  function undo(): ProjectState | null {
    if (!past.current.length) return null;
    const prev = past.current[past.current.length - 1];
    future.current = [present.current, ...future.current];
    past.current = past.current.slice(0, -1);
    present.current = prev;
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
    return fromSnapshot(prev, store.current);
  }

  function redo(): ProjectState | null {
    if (!future.current.length) return null;
    const next = future.current[0];
    past.current = [...past.current, present.current];
    future.current = future.current.slice(1);
    present.current = next;
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
    return fromSnapshot(next, store.current);
  }

  return { push, undo, redo, canUndo, canRedo };
}
