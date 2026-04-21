// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { InputManager } from './InputManager';

describe('InputManager', () => {
  it('H selects pan (Figma Hand)', () => {
    const setActiveTool = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'sample-color',
      setActiveTool,
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      hasDeletableSelection: () => false,
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', bubbles: true, cancelable: true }));
    expect(setActiveTool).toHaveBeenCalledWith('pan');
    m.detach();
  });

  it('Escape selects pan', () => {
    const setActiveTool = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'sample-color',
      setActiveTool,
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      hasDeletableSelection: () => false,
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }));
    expect(setActiveTool).toHaveBeenCalledWith('pan');
    m.detach();
  });

  it('V selects marquee-select (Figma Move)', () => {
    const setActiveTool = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'pan',
      setActiveTool,
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      hasDeletableSelection: () => false,
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV', bubbles: true, cancelable: true }));
    expect(setActiveTool).toHaveBeenCalledWith('marquee-select');
    m.detach();
  });

  it('C selects sample-color', () => {
    const setActiveTool = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'pan',
      setActiveTool,
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      hasDeletableSelection: () => false,
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', bubbles: true, cancelable: true }));
    expect(setActiveTool).toHaveBeenCalledWith('sample-color');
    m.detach();
  });

  it('cmd+ArrowUp nudges brush when sample-color is active', () => {
    const nudge = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'sample-color',
      setActiveTool: vi.fn(),
      nudgeSampleColorBrush: nudge,
      deleteSelected: vi.fn(),
      hasDeletableSelection: () => false,
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    });
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'ArrowUp', metaKey: true, bubbles: true, cancelable: true }),
    );
    expect(nudge).toHaveBeenCalledWith(1);
    m.detach();
  });

  it('Backspace deletes when there is deletable selection', () => {
    const del = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'pan',
      setActiveTool: vi.fn(),
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: del,
      hasDeletableSelection: () => true,
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    });
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Backspace', bubbles: true, cancelable: true }),
    );
    expect(del).toHaveBeenCalledTimes(1);
    m.detach();
  });

  it('X deletes when there is deletable selection', () => {
    const del = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'pan',
      setActiveTool: vi.fn(),
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: del,
      hasDeletableSelection: () => true,
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX', bubbles: true, cancelable: true }));
    expect(del).toHaveBeenCalledTimes(1);
    m.detach();
  });

  it('does not handle keys when target is an input', () => {
    const setActiveTool = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'pan',
      setActiveTool,
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      hasDeletableSelection: () => false,
      historyBack: vi.fn(),
      historyForward: vi.fn(),
    });
    input.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyH', bubbles: true, cancelable: true }),
    );
    expect(setActiveTool).not.toHaveBeenCalled();
    input.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(setActiveTool).not.toHaveBeenCalled();
    m.detach();
    document.body.removeChild(input);
  });

  it('cmd+Z calls historyBack', () => {
    const back = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'pan',
      setActiveTool: vi.fn(),
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      hasDeletableSelection: () => false,
      historyBack: back,
      historyForward: vi.fn(),
    });
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyZ', metaKey: true, bubbles: true, cancelable: true }),
    );
    expect(back).toHaveBeenCalledTimes(1);
    m.detach();
  });

  it('cmd+shift+Z calls historyForward', () => {
    const forward = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'pan',
      setActiveTool: vi.fn(),
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      hasDeletableSelection: () => false,
      historyBack: vi.fn(),
      historyForward: forward,
    });
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'KeyZ',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(forward).toHaveBeenCalledTimes(1);
    m.detach();
  });

  it('cmd+Y calls historyForward', () => {
    const forward = vi.fn();
    const m = new InputManager();
    m.attach({
      getActiveToolId: () => 'pan',
      setActiveTool: vi.fn(),
      nudgeSampleColorBrush: vi.fn(),
      deleteSelected: vi.fn(),
      hasDeletableSelection: () => false,
      historyBack: vi.fn(),
      historyForward: forward,
    });
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyY', metaKey: true, bubbles: true, cancelable: true }),
    );
    expect(forward).toHaveBeenCalledTimes(1);
    m.detach();
  });
});
