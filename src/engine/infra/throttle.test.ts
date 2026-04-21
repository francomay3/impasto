import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle } from './throttle';

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires immediately on the first call (leading edge)', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t('a');
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('suppresses calls within the window', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t('a');
    vi.advanceTimersByTime(40);
    t('b');
    vi.advanceTimersByTime(40);
    t('c');
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('fires a trailing call after the window with the latest args', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t('a');
    vi.advanceTimersByTime(40);
    t('b');
    vi.advanceTimersByTime(40);
    t('c');
    vi.advanceTimersByTime(60); // trailing fires
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, 'c');
  });

  it('fires immediately again after the window expires', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t('a');
    vi.advanceTimersByTime(110);
    t('b');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });

  it('cancel() discards the pending trailing call', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t('a');
    vi.advanceTimersByTime(40);
    t('b');
    t.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce(); // only the leading call
  });

  it('cancel() is safe to call when nothing is pending', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    expect(() => t.cancel()).not.toThrow();
  });

  it('trailing fires only once even if multiple calls land in the window', () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t('a');
    vi.advanceTimersByTime(10);
    t('b');
    vi.advanceTimersByTime(10);
    t('c');
    vi.advanceTimersByTime(10);
    t('d');
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, 'd');
  });
});
