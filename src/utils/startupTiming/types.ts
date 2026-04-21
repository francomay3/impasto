/**
 * Structured startup / editor-load timings (navigation + Project v2 visit span).
 *
 * Consumed by debug tooling and optional future UI; safe to serialize as JSON for bug reports.
 */

export type StartupTimingEvent = {
  phase: string;
  /** Monotonic stamp from {@link performance.now} when the event was recorded. */
  atPerformanceMs: number;
  /** Ms since navigation start (matches former console `+NNNms` prefix). */
  documentElapsedMs: number;
  /** Ms since Project v2 visit boundary, if a visit was marked; otherwise `null`. */
  sinceProjectV2VisitMs: number | null;
  detail?: Record<string, unknown>;
};

export type StartupTimingSnapshot = {
  /** `performance.timeOrigin` for this document (epoch ms). */
  timeOriginMs: number;
  /** `performance.now()` when the current Project v2 visit started, if any. */
  projectV2VisitAtPerformanceMs: number | null;
  /** Idempotent visit key from {@link StartupTimingRecorderApi.ensureVisitMarked}. */
  lastProjectV2VisitKey: string | null;
  events: readonly StartupTimingEvent[];
};

/** Implemented by the full recorder and the no-op stub (same shape for call sites). */
export type StartupTimingRecorderApi = {
  record(phase: string, detail?: Record<string, unknown>): void;
  ensureVisitMarked(meta: { visitKey: string; projectIdSuffix: string }): void;
  logNavigationSummaryOnce(marker: { current: boolean }): void;
  getSnapshot(): StartupTimingSnapshot;
  /** Same as former `editorStartupElapsedMs` export. */
  documentElapsedMsNow(): number;
  /** Vitest / internal only — clears visit + events. */
  resetForTests?(): void;
};
