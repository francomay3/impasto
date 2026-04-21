import type { StartupTimingRecorderApi, StartupTimingSnapshot } from './types';

const emptySnapshot: StartupTimingSnapshot = {
  timeOriginMs: typeof performance !== 'undefined' ? performance.timeOrigin : 0,
  projectV2VisitAtPerformanceMs: null,
  lastProjectV2VisitKey: null,
  events: [],
};

/** Zero-cost placeholder when timing is disabled or before a debug chunk registers a real recorder. */
export const noopStartupTimingRecorder: StartupTimingRecorderApi = {
  record() {},
  ensureVisitMarked() {},
  logNavigationSummaryOnce() {},
  getSnapshot(): StartupTimingSnapshot {
    return emptySnapshot;
  },
  documentElapsedMsNow(): number {
    return typeof performance !== 'undefined' ? Math.round(performance.now() * 10) / 10 : 0;
  },

  resetForTests() {},
};
