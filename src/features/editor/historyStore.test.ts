import { describe, it, expect, beforeEach } from 'vitest'
import { addImage, toSnapshot, fromSnapshot, MAX_HISTORY, MAX_IMAGES, type Snapshot, type ImageId } from './historyStore'
import type { ProjectState, RawImage } from '../types'

function makeImage(tag: string): RawImage {
  return {
    data: new Uint8ClampedArray(4) as Uint8ClampedArray<ArrayBuffer>,
    width: 1,
    height: 1,
    _tag: tag,
  } as unknown as RawImage
}

function makeState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    id: 'test-id',
    name: 'Test',
    sourceImage: null,
    palette: [],
    groups: [],
    paletteSize: 8,
    filters: [],
    preIndexingBlur: 3,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('addImage', () => {
  let store: Map<ImageId, RawImage>
  let order: ImageId[]
  let past: Snapshot[]

  beforeEach(() => {
    store = new Map()
    order = []
    past = []
  })

  it('adds an image and returns a new id', () => {
    const img = makeImage('a')
    const id = addImage(store, order, past, img)
    expect(typeof id).toBe('string')
    expect(store.get(id)).toBe(img)
    expect(order).toContain(id)
  })

  it('returns the same id if the image is already stored', () => {
    const img = makeImage('a')
    const id1 = addImage(store, order, past, img)
    const id2 = addImage(store, order, past, img)
    expect(id1).toBe(id2)
    expect(store.size).toBe(1)
  })

  it('assigns different ids to different image objects', () => {
    const id1 = addImage(store, order, past, makeImage('a'))
    const id2 = addImage(store, order, past, makeImage('b'))
    expect(id1).not.toBe(id2)
  })

  it(`evicts the oldest image when more than ${MAX_IMAGES} images are stored`, () => {
    const imgA = makeImage('a')
    const imgB = makeImage('b')
    const imgC = makeImage('c')
    const idA = addImage(store, order, past, imgA)
    addImage(store, order, past, imgB)
    addImage(store, order, past, imgC)
    expect(store.has(idA)).toBe(false)
    expect(store.size).toBe(MAX_IMAGES)
    expect(order).toHaveLength(MAX_IMAGES)
  })

  it('trims past snapshots whose imageId was evicted', () => {
    const imgA = makeImage('a')
    const imgB = makeImage('b')
    const idA = addImage(store, order, past, imgA)
    const idB = addImage(store, order, past, imgB)

    // Add two snapshots referencing imgA
    const snap1 = makeState({ name: 's1' }) as unknown as Snapshot
    const snap2 = makeState({ name: 's2' }) as unknown as Snapshot
    ;(snap1 as unknown as { imageId: string }).imageId = idA
    ;(snap2 as unknown as { imageId: string }).imageId = idB
    past.push(snap1, snap2)

    const imgC = makeImage('c')
    addImage(store, order, past, imgC)

    // The snap referencing the evicted imgA should have been trimmed
    expect(past.every(s => (s as unknown as { imageId: string }).imageId !== idA)).toBe(true)
  })
})

describe('toSnapshot', () => {
  let store: Map<ImageId, RawImage>
  let order: ImageId[]
  let past: Snapshot[]

  beforeEach(() => {
    store = new Map()
    order = []
    past = []
  })

  it('produces a snapshot with imageId: null when sourceImage is null', () => {
    const state = makeState({ sourceImage: null })
    const snap = toSnapshot(state, store, order, past, null)
    expect(snap.imageId).toBeNull()
  })

  it('stores the image and returns a snapshot with the new imageId', () => {
    const img = makeImage('x')
    const state = makeState({ sourceImage: img })
    const snap = toSnapshot(state, store, order, past, null)
    expect(typeof snap.imageId).toBe('string')
    expect(store.get(snap.imageId!)).toBe(img)
  })

  it('reuses the previous imageId when the image object has not changed', () => {
    const img = makeImage('x')
    const state = makeState({ sourceImage: img })
    const snap1 = toSnapshot(state, store, order, past, null)
    const snap2 = toSnapshot(state, store, order, past, snap1.imageId)
    expect(snap2.imageId).toBe(snap1.imageId)
    expect(store.size).toBe(1)
  })

  it('snapshot does not contain sourceImage', () => {
    const img = makeImage('x')
    const state = makeState({ sourceImage: img })
    const snap = toSnapshot(state, store, order, past, null)
    expect('sourceImage' in snap).toBe(false)
  })
})

describe('fromSnapshot', () => {
  it('resolves sourceImage from the store', () => {
    const img = makeImage('z')
    const store = new Map<ImageId, RawImage>([['img-id', img]])
    const snap = { ...makeState(), sourceImage: undefined, imageId: 'img-id' } as unknown as Snapshot
    const state = fromSnapshot(snap, store)
    expect(state.sourceImage).toBe(img)
  })

  it('returns null sourceImage when imageId is null', () => {
    const snap = { ...makeState(), sourceImage: undefined, imageId: null } as unknown as Snapshot
    const state = fromSnapshot(snap, new Map())
    expect(state.sourceImage).toBeNull()
  })

  it('returns null sourceImage when imageId is not in store', () => {
    const snap = { ...makeState(), sourceImage: undefined, imageId: 'missing' } as unknown as Snapshot
    const state = fromSnapshot(snap, new Map())
    expect(state.sourceImage).toBeNull()
  })
})

describe('toSnapshot / fromSnapshot round-trip', () => {
  it('reconstructs the original state', () => {
    const img = makeImage('rt')
    const original = makeState({ name: 'Round Trip', sourceImage: img })
    const store = new Map<ImageId, RawImage>()
    const order: ImageId[] = []
    const past: Snapshot[] = []
    const snap = toSnapshot(original, store, order, past, null)
    const restored = fromSnapshot(snap, store)
    expect(restored.name).toBe('Round Trip')
    expect(restored.sourceImage).toBe(img)
  })

  it('round-trips a state with no image', () => {
    const original = makeState({ name: 'No Image', sourceImage: null })
    const store = new Map<ImageId, RawImage>()
    const order: ImageId[] = []
    const past: Snapshot[] = []
    const snap = toSnapshot(original, store, order, past, null)
    const restored = fromSnapshot(snap, store)
    expect(restored.sourceImage).toBeNull()
    expect(restored.name).toBe('No Image')
  })
})

describe('MAX_HISTORY constant', () => {
  it('is a positive integer', () => {
    expect(Number.isInteger(MAX_HISTORY)).toBe(true)
    expect(MAX_HISTORY).toBeGreaterThan(0)
  })
})
