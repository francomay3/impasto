/**
 * A leading+trailing throttle: the first call in a cold window fires immediately;
 * subsequent calls within the same window update the pending args; the trailing
 * timer fires once after the window expires with the most-recent args.
 *
 * Call `.cancel()` to discard the pending trailing call (e.g. on dispose).
 */
export type ThrottledFn<T extends unknown[]> = {
  (...args: T): void;
  cancel(): void;
};

export function throttle<T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
): ThrottledFn<T> {
  // -Infinity ensures the first call always fires immediately regardless of the clock's epoch.
  let lastRan = -Infinity;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: T | null = null;

  const runTrailing = (): void => {
    timer = null;
    const args = latestArgs;
    latestArgs = null;
    if (args !== null) {
      lastRan = Date.now();
      fn(...args);
    }
  };

  const throttled = (...args: T): void => {
    const remaining = ms - (Date.now() - lastRan);
    if (remaining <= 0) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
        latestArgs = null;
      }
      lastRan = Date.now();
      fn(...args);
    } else {
      latestArgs = args;
      if (timer === null) {
        timer = setTimeout(runTrailing, remaining);
      }
    }
  };

  throttled.cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    latestArgs = null;
  };

  return throttled;
}
