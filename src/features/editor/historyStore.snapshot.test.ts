import { describe, it, expect, beforeEach } from 'vitest';
import {
  toSnapshot,
  fromSnapshot,
  MAX_HISTORY,
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

describe('toSnapshot', () => {
  let store: Map<ImageId, RawImage>;
  let order: ImageId[];
  let past: Snapshot[];

  beforeEach(() => {
    store = new Map();
    order = [];
    past = [];
  });

  it('produces a snapshot with imageId: null when image is null', () => {
    const state = makeState();
    const snap = toSnapshot(state, null, store, order, past, null);
    expect(snap.imageId).toBeNull();
  });

  it('stores the image and returns a snapshot with the new imageId', () => {
    const img = makeImage('x');
    const state = makeState();
    const snap = toSnapshot(state, img, store, order, past, null);
    expect(typeof snap.imageId).toBe('string');
    expect(store.get(snap.imageId!)).toBe(img);
  });

  it('reuses the previous imageId when the image object has not changed', () => {
    const img = makeImage('x');
    const state = makeState();
    const snap1 = toSnapshot(state, img, store, order, past, null);
    const snap2 = toSnapshot(state, img, store, order, past, snap1.imageId);
    expect(snap2.imageId).toBe(snap1.imageId);
    expect(store.size).toBe(1);
  });

  it('snapshot does not contain sourceImage', () => {
    const img = makeImage('x');
    const state = makeState();
    const snap = toSnapshot(state, img, store, order, past, null);
    expect('sourceImage' in snap).toBe(false);
  });
});

describe('fromSnapshot', () => {
  it('resolves image from the store', () => {
    const img = makeImage('z');
    const store = new Map<ImageId, RawImage>([['img-id', img]]);
    const snap = { ...makeState(), imageId: 'img-id' } as Snapshot;
    const { image } = fromSnapshot(snap, store);
    expect(image).toBe(img);
  });

  it('returns null image when imageId is null', () => {
    const snap = { ...makeState(), imageId: null } as Snapshot;
    const { image } = fromSnapshot(snap, new Map());
    expect(image).toBeNull();
  });

  it('returns null image when imageId is not in store', () => {
    const snap = { ...makeState(), imageId: 'missing' } as Snapshot;
    const { image } = fromSnapshot(snap, new Map());
    expect(image).toBeNull();
  });
});

describe('toSnapshot / fromSnapshot round-trip', () => {
  it('reconstructs the original state and image', () => {
    const img = makeImage('rt');
    const original = makeState({ name: 'Round Trip' });
    const store = new Map<ImageId, RawImage>();
    const order: ImageId[] = [];
    const past: Snapshot[] = [];
    const snap = toSnapshot(original, img, store, order, past, null);
    const { state, image } = fromSnapshot(snap, store);
    expect(state.name).toBe('Round Trip');
    expect(image).toBe(img);
  });

  it('round-trips a state with no image', () => {
    const original = makeState({ name: 'No Image' });
    const store = new Map<ImageId, RawImage>();
    const order: ImageId[] = [];
    const past: Snapshot[] = [];
    const snap = toSnapshot(original, null, store, order, past, null);
    const { state, image } = fromSnapshot(snap, store);
    expect(image).toBeNull();
    expect(state.name).toBe('No Image');
  });
});

describe('MAX_HISTORY constant', () => {
  it('is a positive integer', () => {
    expect(Number.isInteger(MAX_HISTORY)).toBe(true);
    expect(MAX_HISTORY).toBeGreaterThan(0);
  });
});
