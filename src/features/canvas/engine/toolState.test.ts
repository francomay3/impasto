import { describe, it, expect, vi } from 'vitest'
import { CanvasEngine } from './CanvasEngine'

describe('CanvasEngine tool state', () => {
  it('initial tool state is select, not sampling', () => {
    const engine = new CanvasEngine()
    const tool = engine.getSnapshot().tool
    expect(tool.activeTool).toBe('select')
    expect(tool.isSampling).toBe(false)
    expect(tool.samplingRadius).toBe(30)
  })

  it('selectTool("marquee") transitions to marquee', () => {
    const engine = new CanvasEngine()
    engine.selectTool('marquee')
    expect(engine.getSnapshot().tool.activeTool).toBe('marquee')
  })

  it('selectTool("select") from marquee returns to select', () => {
    const engine = new CanvasEngine()
    engine.selectTool('marquee')
    engine.selectTool('select')
    expect(engine.getSnapshot().tool.activeTool).toBe('select')
  })

  it('activateEyedropper() sets activeTool to eyedropper', () => {
    const engine = new CanvasEngine()
    engine.activateEyedropper()
    expect(engine.getSnapshot().tool.activeTool).toBe('eyedropper')
  })

  it('activateEyedropper() sets isSampling to true', () => {
    const engine = new CanvasEngine()
    engine.activateEyedropper()
    expect(engine.getSnapshot().tool.isSampling).toBe(true)
  })

  it('toggleMarquee() from select switches to marquee', () => {
    const engine = new CanvasEngine()
    engine.toggleMarquee()
    expect(engine.getSnapshot().tool.activeTool).toBe('marquee')
  })

  it('toggleMarquee() from marquee switches back to select', () => {
    const engine = new CanvasEngine()
    engine.toggleMarquee()
    engine.toggleMarquee()
    expect(engine.getSnapshot().tool.activeTool).toBe('select')
  })

  it('startSamplingColor() stores colorId and sets isSampling', () => {
    const engine = new CanvasEngine()
    engine.startSamplingColor('color-1')
    const tool = engine.getSnapshot().tool
    expect(tool.samplingColorId).toBe('color-1')
    expect(tool.isSampling).toBe(true)
  })

  it('completeSample() clears sampling state', () => {
    const engine = new CanvasEngine()
    engine.startSamplingColor('color-1')
    engine.completeSample()
    const tool = engine.getSnapshot().tool
    expect(tool.isSampling).toBe(false)
    expect(tool.samplingColorId).toBeNull()
    expect(tool.activeTool).toBe('select')
  })

  it('cancel() clears sampling state and returns to select', () => {
    const engine = new CanvasEngine()
    engine.startSamplingColor('color-1')
    engine.cancel()
    const tool = engine.getSnapshot().tool
    expect(tool.isSampling).toBe(false)
    expect(tool.activeTool).toBe('select')
  })

  it('setSamplingRadius() updates radius', () => {
    const engine = new CanvasEngine()
    engine.setSamplingRadius(60)
    expect(engine.getSnapshot().tool.samplingRadius).toBe(60)
  })

  it('startSamplingLevels() sets samplingLevels and isSampling', () => {
    const engine = new CanvasEngine()
    engine.startSamplingLevels('filter-1', 'black')
    const tool = engine.getSnapshot().tool
    expect(tool.isSampling).toBe(true)
    expect(tool.samplingLevels).toEqual({ filterId: 'filter-1', point: 'black' })
  })

  it('tool state changes notify subscribers', () => {
    const engine = new CanvasEngine()
    const listener = vi.fn()
    engine.subscribe(listener)
    const callsBefore = listener.mock.calls.length
    engine.selectTool('marquee')
    expect(listener.mock.calls.length).toBeGreaterThan(callsBefore)
  })
})
