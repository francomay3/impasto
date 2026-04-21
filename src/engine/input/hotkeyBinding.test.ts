import { describe, expect, it, vi } from 'vitest';
import { dispatchHotkey, sortHotkeyBindings, type HotkeyBinding, type HotkeyToolContext } from './hotkeyBinding';

describe('hotkeyBinding', () => {
  it('sortHotkeyBindings orders by descending priority', () => {
    const a: HotkeyBinding = { priority: 1, match: () => true, run: vi.fn() };
    const b: HotkeyBinding = { priority: 100, match: () => true, run: vi.fn() };
    const c: HotkeyBinding = { priority: 50, match: () => true, run: vi.fn() };
    expect(sortHotkeyBindings([a, b, c]).map((x) => x.priority)).toEqual([100, 50, 1]);
  });

  it('dispatchHotkey runs first matching binding and prevents default', () => {
    const low: HotkeyBinding = {
      priority: 10,
      match: (e) => e.code === 'KeyA',
      run: vi.fn(),
    };
    const high: HotkeyBinding = {
      priority: 100,
      match: (e) => e.code === 'KeyA',
      run: vi.fn(),
    };
    const ev = { code: 'KeyA', repeat: false, preventDefault: vi.fn() } as unknown as KeyboardEvent;
    const ctx: HotkeyToolContext = { activeToolId: 'pan', hasDeletableSelection: false };
    const host = {
      setActiveTool: vi.fn(),
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    };
    const ok = dispatchHotkey(ev, ctx, sortHotkeyBindings([low, high]), host);
    expect(ok).toBe(true);
    expect(high.run).toHaveBeenCalledTimes(1);
    expect(low.run).not.toHaveBeenCalled();
    expect(ev.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('dispatchHotkey skips repeat when allowRepeat is false', () => {
    const b: HotkeyBinding = {
      priority: 10,
      match: () => true,
      run: vi.fn(),
    };
    const ev = { code: 'KeyA', repeat: true, preventDefault: vi.fn() } as unknown as KeyboardEvent;
    const ctx: HotkeyToolContext = { activeToolId: 'pan', hasDeletableSelection: false };
    const host = {
      setActiveTool: vi.fn(),
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    };
    const ok = dispatchHotkey(ev, ctx, [b], host);
    expect(ok).toBe(false);
    expect(b.run).not.toHaveBeenCalled();
  });
});
