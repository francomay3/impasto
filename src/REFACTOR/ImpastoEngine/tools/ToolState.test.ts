import { describe, expect, it, vi } from 'vitest';
import { ToolState } from './ToolState';
import { MarqueeTool, marqueeUiModeFromToolsState } from './MarqueeTool';
import { SampleColorTool } from './SampleColorTool';
import { PanTool } from './PanTool';

// ---------------------------------------------------------------------------
// ToolState
// ---------------------------------------------------------------------------

describe('ToolState', () => {
  it('subscribe returns an unsubscribe that stops future notifications', () => {
    const state = new ToolState();
    const listener = vi.fn();
    const unsub = state.subscribe(listener);

    state.setActiveTool('sample-color');
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    state.setActiveTool('marquee-select');
    // Listener must NOT be called again after unsubscribe.
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('setActiveTool with the same id is a no-op (listener not called)', () => {
    const state = new ToolState();
    const listener = vi.fn();
    state.subscribe(listener);

    // Default active tool is 'pan', so setting it again should be a no-op.
    state.setActiveTool('pan');
    expect(listener).not.toHaveBeenCalled();
  });

  it('setToolParamValue with applyParam returning changed:false does not emit', () => {
    const state = new ToolState();
    const listener = vi.fn();
    state.subscribe(listener);

    // Set marquee-select active first so we can hit the applyParam path.
    state.setActiveTool('marquee-select');
    listener.mockClear();

    // Setting the same mode ('replace') that is already the default → changed:false.
    state.setToolParamValue('marquee-select', 'marqueeMode', 'replace');
    expect(listener).not.toHaveBeenCalled();
  });

  it('emit calls all registered listeners', () => {
    const state = new ToolState();
    const a = vi.fn();
    const b = vi.fn();
    const c = vi.fn();
    state.subscribe(a);
    state.subscribe(b);
    state.subscribe(c);

    state.setActiveTool('sample-color');

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// MarqueeTool
// ---------------------------------------------------------------------------

describe('MarqueeTool', () => {
  const tool = new MarqueeTool();

  it('applyParam with null internal falls back to default and accepts a new mode', () => {
    // null → parseInternal falls back to { mode: 'replace' }; 'add' ≠ 'replace' → changed:true
    const result = tool.applyParam(null, 'marqueeMode', 'add');
    expect(result).not.toBeNull();
    expect(result!.changed).toBe(true);
    expect((result!.next as { mode: string }).mode).toBe('add');
  });

  it('applyParam with wrong key returns null', () => {
    expect(tool.applyParam({}, 'unknownKey', 'add')).toBeNull();
  });

  it('applyParam with invalid mode value returns null', () => {
    expect(tool.applyParam({}, 'marqueeMode', 'invalid-mode')).toBeNull();
  });

  it('applyParam with same mode returns changed:false', () => {
    const result = tool.applyParam({ mode: 'replace' }, 'marqueeMode', 'replace');
    expect(result).not.toBeNull();
    expect(result!.changed).toBe(false);
  });

  it('applyParam with different mode returns changed:true with the new mode', () => {
    const result = tool.applyParam({ mode: 'replace' }, 'marqueeMode', 'add');
    expect(result).not.toBeNull();
    expect(result!.changed).toBe(true);
    expect((result!.next as { mode: string }).mode).toBe('add');
  });
});

describe('marqueeUiModeFromToolsState', () => {
  it('returns "replace" for a non-marquee tool', () => {
    const panTool = new PanTool();
    const snap = panTool.toToolSnapshot({});
    expect(marqueeUiModeFromToolsState(snap)).toBe('replace');
  });

  it('returns the stored mode for the marquee tool after a param change', () => {
    const marqueeTool = new MarqueeTool();
    const internal = marqueeTool.applyParam({ mode: 'replace' }, 'marqueeMode', 'subtract');
    const snap = marqueeTool.toToolSnapshot(internal!.next);
    expect(marqueeUiModeFromToolsState(snap)).toBe('subtract');
  });

  it('returns "replace" when the marquee tool has no matching param in config', () => {
    // Pass a Tool-shaped object that has marquee-select id but empty params list.
    const toolWithNoParams = {
      id: 'marquee-select' as const,
      label: 'Marquee',
      config: { params: [] },
    };
    expect(marqueeUiModeFromToolsState(toolWithNoParams)).toBe('replace');
  });
});

// ---------------------------------------------------------------------------
// SampleColorTool
// ---------------------------------------------------------------------------

describe('SampleColorTool', () => {
  const tool = new SampleColorTool();

  it('pointerChrome returns grabbing/no-ring when panDrag is active (filtered surface)', () => {
    const result = tool.pointerChrome({
      surface: 'filtered',
      pointerInside: true,
      panDrag: { pointerButton: 0 },
    });
    expect(result).toEqual({ cursor: 'grabbing', sampleRingActive: false });
  });

  it('pointerChrome returns none/ring-active when pointer inside on filtered surface', () => {
    const result = tool.pointerChrome({
      surface: 'filtered',
      pointerInside: true,
      panDrag: null,
    });
    expect(result).toEqual({ cursor: 'none', sampleRingActive: true });
  });

  it('pointerChrome returns grab/no-ring when on source surface (color sampling unavailable)', () => {
    // Source surface does not allow color pins, so effectivePrimaryDragPan kicks in
    // via navigationWhenSampleUnavailableOnSurface → 'grab' cursor.
    const result = tool.pointerChrome({
      surface: 'source',
      pointerInside: false,
      panDrag: null,
    });
    expect(result).toEqual({ cursor: 'grab', sampleRingActive: false });
  });

  it('pointerChrome returns default/no-ring when pointer is outside on filtered surface', () => {
    const result = tool.pointerChrome({
      surface: 'filtered',
      pointerInside: false,
      panDrag: null,
    });
    expect(result).toEqual({ cursor: 'default', sampleRingActive: false });
  });

  it('applyParam with unknown key returns null', () => {
    expect(tool.applyParam({}, 'unknownKey', 5)).toBeNull();
  });

  it('applyParam returns changed:false when value equals the current brush size (DEFAULT=4)', () => {
    // { brushSize: 4 } → parseInternal returns 4; clamp(4) = 4; 4 === 4 → changed:false
    const result = tool.applyParam({ brushSize: 4 }, 'brushSize', 4);
    expect(result).not.toBeNull();
    expect(result!.changed).toBe(false);
  });

  it('applyParam with null internal falls back to default (4) and returns changed:true for 8', () => {
    // null → parseInternal returns DEFAULT=4; clamp(8)=8; 4 ≠ 8 → changed:true
    const result = tool.applyParam(null, 'brushSize', 8);
    expect(result).not.toBeNull();
    expect(result!.changed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PanTool
// ---------------------------------------------------------------------------

describe('PanTool', () => {
  const tool = new PanTool();

  it('pointerChrome returns default/no-ring when pointer is outside on filtered surface', () => {
    // pointerInside is false, so the grab branch is skipped → default cursor.
    const result = tool.pointerChrome({
      surface: 'filtered',
      pointerInside: false,
      panDrag: null,
    });
    expect(result).toEqual({ cursor: 'default', sampleRingActive: false });
  });

  it('applyParam always returns null (PanTool has no params)', () => {
    expect(tool.applyParam({}, 'anyKey', 'anyValue')).toBeNull();
  });
});
