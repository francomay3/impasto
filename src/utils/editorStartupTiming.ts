/**
 * Startup / editor-load timing: events are **stored only** (no per-phase console noise).
 * Call {@link logStartupTimingSnapshot} or {@link getStartupTimingSnapshot} when you want output.
 *
 * - **Instrumentation:** {@link logEditorStartupPhase}, {@link ensureProjectV2VisitMarked}, etc.
 * - **Read:** {@link getStartupTimingSnapshot} returns the full timeline object.
 *
 * Implementation lives under `startupTiming/` for optional future code-splitting.
 *
 * Enabled when `import.meta.env.DEV` **or** `localStorage.impasto_debug_startup === '1'`.
 */

import { isStartupTimingEnabled } from './startupTiming/enabled';
import {
  getStartupTimingRecorder,
  getStartupTimingSnapshot,
  resetStartupTimingStateForTests,
} from './startupTiming/registry';

export { isStartupTimingEnabled as isEditorStartupTimingEnabled } from './startupTiming/enabled';
export { getStartupTimingSnapshot, resetStartupTimingStateForTests };

export function logEditorStartupPhase(phase: string, detail?: Record<string, unknown>): void {
  getStartupTimingRecorder().record(phase, detail);
}

export function ensureProjectV2VisitMarked(meta: { visitKey: string; projectIdSuffix: string }): void {
  getStartupTimingRecorder().ensureVisitMarked(meta);
}

export function logDocumentNavigationSummaryOnce(marker: { current: boolean }): void {
  getStartupTimingRecorder().logNavigationSummaryOnce(marker);
}

/** Elapsed ms since this navigation began. */
export function editorStartupElapsedMs(): number {
  return getStartupTimingRecorder().documentElapsedMsNow();
}

/**
 * Single structured `console.log` of {@link getStartupTimingSnapshot} — the opt-in dump (no per-event spam).
 */
export function logStartupTimingSnapshot(label = 'timing snapshot'): void {
  if (!isStartupTimingEnabled()) {
    return;
  }
  console.log(`[impasto startup] ${label}`, getStartupTimingSnapshot());
}
