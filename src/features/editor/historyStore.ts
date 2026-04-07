import type { ProjectState, RawImage } from '../../types';

export type ImageId = string;
export type Snapshot = ProjectState & { imageId: ImageId | null };

export const MAX_HISTORY = 50;
export const MAX_IMAGES = 2;

export function addImage(
  store: Map<ImageId, RawImage>,
  order: ImageId[],
  past: Snapshot[],
  image: RawImage
): ImageId {
  for (const [id, img] of store) if (img === image) return id;
  const id = crypto.randomUUID();
  store.set(id, image);
  order.push(id);
  if (order.length > MAX_IMAGES) {
    const evictId = order.shift()!;
    store.delete(evictId);
    let cut = -1;
    for (let i = past.length - 1; i >= 0; i--) {
      if (past[i].imageId === evictId) {
        cut = i;
        break;
      }
    }
    if (cut >= 0) past.splice(0, cut + 1);
  }
  return id;
}

export function toSnapshot(
  state: ProjectState,
  image: RawImage | null,
  store: Map<ImageId, RawImage>,
  order: ImageId[],
  past: Snapshot[],
  prevImageId: ImageId | null
): Snapshot {
  if (!image) return { ...state, imageId: null };
  if (prevImageId && store.get(prevImageId) === image)
    return { ...state, imageId: prevImageId };
  return { ...state, imageId: addImage(store, order, past, image) };
}

export function fromSnapshot(
  snapshot: Snapshot,
  store: Map<ImageId, RawImage>
): { state: ProjectState; image: RawImage | null } {
  const { imageId, ...state } = snapshot;
  return { state, image: imageId ? (store.get(imageId) ?? null) : null };
}
