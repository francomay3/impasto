import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { interactionMachine, deriveToolState } from './interactionMachine'

function startActor() {
  const actor = createActor(interactionMachine)
  actor.start()
  return actor
}

describe('interactionMachine', () => {
  it('starts in select state', () => {
    const actor = startActor()
    expect(actor.getSnapshot().value).toBe('select')
  })

  it('SELECT_TOOL marquee transitions to marquee', () => {
    const actor = startActor()
    actor.send({ type: 'SELECT_TOOL', tool: 'marquee' })
    expect(actor.getSnapshot().value).toBe('marquee')
  })

  it('SELECT_TOOL select from marquee returns to select', () => {
    const actor = startActor()
    actor.send({ type: 'SELECT_TOOL', tool: 'marquee' })
    actor.send({ type: 'SELECT_TOOL', tool: 'select' })
    expect(actor.getSnapshot().value).toBe('select')
  })

  it('ACTIVATE_EYEDROPPER transitions to adding_color', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE_EYEDROPPER' })
    expect(actor.getSnapshot().value).toBe('adding_color')
  })

  it('START_SAMPLING_COLOR transitions to sampling_color and stores colorId', () => {
    const actor = startActor()
    actor.send({ type: 'START_SAMPLING_COLOR', colorId: 'abc' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('sampling_color')
    expect(snap.context.samplingColorId).toBe('abc')
  })

  it('SAMPLE_COMPLETE from sampling_color returns to select and clears colorId', () => {
    const actor = startActor()
    actor.send({ type: 'START_SAMPLING_COLOR', colorId: 'abc' })
    actor.send({ type: 'SAMPLE_COMPLETE' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('select')
    expect(snap.context.samplingColorId).toBeNull()
  })

  it('CANCEL from sampling_color returns to select', () => {
    const actor = startActor()
    actor.send({ type: 'START_SAMPLING_COLOR', colorId: 'abc' })
    actor.send({ type: 'CANCEL' })
    expect(actor.getSnapshot().value).toBe('select')
  })

  it('SET_SAMPLING_RADIUS updates radius in any state', () => {
    const actor = startActor()
    actor.send({ type: 'SET_SAMPLING_RADIUS', radius: 50 })
    expect(actor.getSnapshot().context.samplingRadius).toBe(50)
  })

  it('START_SAMPLING_LEVELS transitions to sampling_levels', () => {
    const actor = startActor()
    actor.send({ type: 'START_SAMPLING_LEVELS', filterId: 'f1', point: 'black' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('sampling_levels')
    expect(snap.context.samplingLevels).toEqual({ filterId: 'f1', point: 'black' })
  })
})

describe('deriveToolState', () => {
  const baseCtx = { samplingColorId: null, samplingLevels: null, samplingRadius: 30 }

  it('select state → activeTool select, not sampling', () => {
    const s = deriveToolState(baseCtx, 'select')
    expect(s.activeTool).toBe('select')
    expect(s.isSampling).toBe(false)
  })

  it('marquee state → activeTool marquee', () => {
    expect(deriveToolState(baseCtx, 'marquee').activeTool).toBe('marquee')
  })

  it('adding_color state → activeTool eyedropper, isSampling true', () => {
    const s = deriveToolState(baseCtx, 'adding_color')
    expect(s.activeTool).toBe('eyedropper')
    expect(s.isSampling).toBe(true)
  })

  it('sampling_color state → isSampling true', () => {
    expect(deriveToolState(baseCtx, 'sampling_color').isSampling).toBe(true)
  })

  it('sampling_levels state → isSampling true', () => {
    expect(deriveToolState(baseCtx, 'sampling_levels').isSampling).toBe(true)
  })

  it('propagates context fields', () => {
    const ctx = { samplingColorId: 'x', samplingLevels: { filterId: 'f', point: 'white' as const }, samplingRadius: 45 }
    const s = deriveToolState(ctx, 'select')
    expect(s.samplingColorId).toBe('x')
    expect(s.samplingLevels).toEqual({ filterId: 'f', point: 'white' })
    expect(s.samplingRadius).toBe(45)
  })
})
