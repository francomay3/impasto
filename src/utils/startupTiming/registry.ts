import { isStartupTimingEnabled } from './enabled';
import { createFullStartupTimingRecorder } from './fullRecorder';
import { noopStartupTimingRecorder } from './noopRecorder';
import type { StartupTimingRecorderApi, StartupTimingSnapshot } from './types';

/**
 * Active recorder. When timing is off, {@link noopStartupTimingRecorder} is returned (no allocations).
 * Future: assign a recorder loaded from a separate chunk before the first {@link getStartupTimingRecorder} call,
 * or add a tiny ring-buffer for events recorded before the chunk arrives.
 */
let activeRecorder: StartupTimingRecorderApi | null = null;

function resolveRecorder(): StartupTimingRecorderApi {
  if (!isStartupTimingEnabled()) {
    return noopStartupTimingRecorder;
  }
  if (!activeRecorder) {
    activeRecorder = createFullStartupTimingRecorder();
  }
  return activeRecorder;
}

/** Used by instrumentation call sites (boot, auth, persistence, project shell). */
export function getStartupTimingRecorder(): StartupTimingRecorderApi {
  return resolveRecorder();
}

/** Structured export for debug UI, bug reports, or future JSON download. */
export function getStartupTimingSnapshot(): StartupTimingSnapshot {
  return resolveRecorder().getSnapshot();
}

/**
 * Registers a recorder from a future **dynamic import** (debug-only chunk). Only takes effect while
 * {@link activeRecorder} is still `null` — the first {@link getStartupTimingRecorder} call wins today.
 * Add a small ring-buffer in front of this if you need chunk-first loading without losing early boot marks.
 */
export function registerStartupTimingRecorder(recorder: StartupTimingRecorderApi): void {
  if (activeRecorder !== null) {
    return;
  }
  activeRecorder = recorder;
}

/** @internal Vitest — drops the lazy recorder so the next call creates a fresh instance. */
export function resetStartupTimingStateForTests(): void {
  if (import.meta.env.MODE !== 'test') {
    return;
  }
  activeRecorder?.resetForTests?.();
  activeRecorder = null;
}
