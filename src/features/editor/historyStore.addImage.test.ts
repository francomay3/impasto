import { describe, it, expect, beforeEach } from 'vitest';
import {
  addImage,
  MAX_IMAGES,
  type Snapshot,
  type ImageId,
} from './historyStore';
import type { ProjectState, RawImage } from '../../types';

function makeImage(tag: string): RawImage {
  return {
    data: new Uint8ClampedArray(4) as Uint8ClampedArray<ArrayBuffer>,
    width: 1,
    height: 1,
    _tag: tag,
  } as unknown as RawImage;
}

function makeState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    id: 'test-id',
    name: 'Test',
    palette: [],
    groups: [],
    paletteSize: 8,
    filters: [],
    preIndexingBlur: 3,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('addImage', () => {
  let store: Map<ImageId, RawImage>;
  let order: ImageId[];
  let past: Snapshot[];

  beforeEach(() => {
    store = new Map();
    order = [];
    past = [];
  });

  it('adds an image and returns a new id', () => {
    const img = makeImage('a');
    const id = addImage(store, order, past, img);
    expect(typeof id).toBe('string');
    expect(store.get(id)).toBe(img);
    expect(order).toContain(id);
  });

  it('returns the same id if the image is already stored', () => {
    const img = makeImage('a');
    const id1 = addImage(store, order, past, img);
    const id2 = addImage(store, order, past, img);
    expect(id1).toBe(id2);
    expect(store.size).toBe(1);
  });

  it('assigns different ids to different image objects', () => {
    const id1 = addImage(store, order, past, makeImage('a'));
    const id2 = addImage(store, order, past, makeImage('b'));
    expect(id1).not.toBe(id2);
  });

  it(`evicts the oldest image when more than ${MAX_IMAGES} images are stored`, () => {
    const imgA = makeImage('a');
    const imgB = makeImage('b');
    const imgC = makeImage('c');
    const idA = addImage(store, order, past, imgA);
    addImage(store, order, past, imgB);
    addImage(store, order, past, imgC);
    expect(store.has(idA)).toBe(false);
    expect(store.size).toBe(MAX_IMAGES);
    expect(order).toHaveLength(MAX_IMAGES);
  });

  it('trims past snapshots whose imageId was evicted', () => {
    const imgA = makeImage('a');
    const imgB = makeImage('b');
    const idA = addImage(store, order, past, imgA);
    const idB = addImage(store, order, past, imgB);

    const snap1 = makeState({ name: 's1' }) as unknown as Snapshot;
    const snap2 = makeState({ name: 's2' }) as unknown as Snapshot;
    (snap1 as unknown as { imageId: string }).imageId = idA;
    (snap2 as unknown as { imageId: string }).imageId = idB;
    past.push(snap1, snap2);

    const imgC = makeImage('c');
    addImage(store, order, past, imgC);

    expect(past.every((s) => (s as unknown as { imageId: string }).imageId !== idA)).toBe(true);
  });
});
