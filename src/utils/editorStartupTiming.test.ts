import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  editorStartupElapsedMs,
  ensureProjectV2VisitMarked,
  getStartupTimingSnapshot,
  logDocumentNavigationSummaryOnce,
  logEditorStartupPhase,
  logStartupTimingSnapshot,
  resetStartupTimingStateForTests,
} from './editorStartupTiming';
import { noopStartupTimingRecorder } from './startupTiming/noopRecorder';
import { registerStartupTimingRecorder } from './startupTiming/registry';

describe('editorStartupTiming', () => {
  beforeEach(() => {
    resetStartupTimingStateForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      globalThis.localStorage?.removeItem('impasto_debug_startup');
    } catch {
      /* ignore */
    }
  });

  it('elapsed ms is non-negative', () => {
    expect(editorStartupElapsedMs()).toBeGreaterThanOrEqual(0);
  });

  it('logEditorStartupPhase does not call console (data is in snapshot only)', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubEnv('DEV', true);

    logEditorStartupPhase('test-phase');

    expect(info).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(getStartupTimingSnapshot().events.some((e) => e.phase === 'test-phase')).toBe(true);
  });

  it('stores events on snapshot after record', () => {
    vi.stubEnv('DEV', true);
    logEditorStartupPhase('snapshot-test-phase', { foo: 1 });
    const snap = getStartupTimingSnapshot();
    expect(snap.events.some((e) => e.phase === 'snapshot-test-phase')).toBe(true);
    expect(snap.events.find((e) => e.phase === 'snapshot-test-phase')?.detail?.foo).toBe(1);
  });

  it('ensureProjectV2VisitMarked dedupes by visitKey', () => {
    vi.stubEnv('DEV', true);
    ensureProjectV2VisitMarked({ visitKey: 'dedupe-key-a', projectIdSuffix: 'x1' });
    ensureProjectV2VisitMarked({ visitKey: 'dedupe-key-a', projectIdSuffix: 'x1' });
    const visitCount = getStartupTimingSnapshot().events.filter((e) => e.phase.includes('visit boundary'))
      .length;
    expect(visitCount).toBe(1);
  });

  it('registerStartupTimingRecorder can install noop before first record (chunk hook simulation)', () => {
    vi.stubEnv('DEV', true);
    resetStartupTimingStateForTests();
    registerStartupTimingRecorder(noopStartupTimingRecorder);
    logEditorStartupPhase('chunk-placeholder');
    expect(getStartupTimingSnapshot().events.length).toBe(0);
  });

  it('logDocumentNavigationSummaryOnce records once in snapshot', () => {
    vi.stubEnv('DEV', true);
    const nav = {
      entryType: 'navigation',
      type: 'reload',
      redirectCount: 0,
      fetchStart: 10,
      responseStart: 50,
      responseEnd: 80,
      domInteractive: 120,
      domContentLoadedEventEnd: 125,
      loadEventEnd: 130,
      domainLookupStart: 5,
      domainLookupEnd: 15,
      connectStart: 15,
      connectEnd: 40,
      requestStart: 40,
    } as unknown as PerformanceNavigationTiming;

    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([nav]);

    const marker = { current: false };
    logDocumentNavigationSummaryOnce(marker);
    logDocumentNavigationSummaryOnce(marker);

    expect(marker.current).toBe(true);
    const summaryEvents = getStartupTimingSnapshot().events.filter((e) =>
      e.phase.includes('Navigation Timing summary'),
    );
    expect(summaryEvents.length).toBe(1);
  });

  it('logStartupTimingSnapshot prints one console.log with snapshot', () => {
    vi.stubEnv('DEV', true);
    logEditorStartupPhase('before-dump');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    logStartupTimingSnapshot('custom label');

    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0][0])).toContain('[impasto startup]');
    expect(String(log.mock.calls[0][0])).toContain('custom label');
    expect(log.mock.calls[0][1]).toEqual(getStartupTimingSnapshot());
  });
});
