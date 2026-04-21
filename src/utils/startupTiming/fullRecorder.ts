import type { StartupTimingEvent, StartupTimingRecorderApi, StartupTimingSnapshot } from './types';

function roundMs(x: number): number {
  return Math.round(x * 10) / 10;
}

function durMs(a: number, b: number): number {
  return roundMs(Math.max(0, b - a));
}

function optionalIntervalMs(start: number, end: number): number | undefined {
  return start > 0 && end > 0 ? durMs(start, end) : undefined;
}

function navTransferAndDecodedSizes(nav: PerformanceNavigationTiming): {
  transferSize: number | undefined;
  decodedBodySize: number | undefined;
} {
  return {
    transferSize: 'transferSize' in nav ? (nav as PerformanceNavigationTiming & { transferSize?: number }).transferSize : undefined,
    decodedBodySize:
      'decodedBodySize' in nav
        ? (nav as PerformanceNavigationTiming & { decodedBodySize?: number }).decodedBodySize
        : undefined,
  };
}

function buildNavigationTimingSummaryDetail(nav: PerformanceNavigationTiming): Record<string, unknown> {
  const sizes = navTransferAndDecodedSizes(nav);
  return {
    navType: nav.type,
    redirectCount: nav.redirectCount,
    dnsMs: optionalIntervalMs(nav.domainLookupStart, nav.domainLookupEnd),
    tcpMs: optionalIntervalMs(nav.connectStart, nav.connectEnd),
    ttfbMs: optionalIntervalMs(nav.requestStart, nav.responseStart),
    networkWaitMs: optionalIntervalMs(nav.fetchStart, nav.responseStart),
    downloadMs: optionalIntervalMs(nav.responseStart, nav.responseEnd),
    domInteractiveMs: optionalIntervalMs(nav.responseEnd, nav.domInteractive),
    responseToDomInteractiveMs: optionalIntervalMs(nav.responseEnd, nav.domInteractive),
    loadEventMs: optionalIntervalMs(nav.domContentLoadedEventEnd, nav.loadEventEnd),
    ...sizes,
  };
}

export function createFullStartupTimingRecorder(): StartupTimingRecorderApi {
  const events: StartupTimingEvent[] = [];

  let projectV2VisitStartPerformanceMs: number | null = null;
  let lastProjectV2VisitKey: string | null = null;

  function visitElapsedMs(): number | null {
    if (projectV2VisitStartPerformanceMs === null) {
      return null;
    }
    return roundMs(performance.now() - projectV2VisitStartPerformanceMs);
  }

  function mergeVisitDetail(detail?: Record<string, unknown>): Record<string, unknown> | undefined {
    const visit = visitElapsedMs();
    if (visit === null) {
      return detail;
    }
    if (detail === undefined || Object.keys(detail).length === 0) {
      return { sinceProjectV2VisitMs: visit };
    }
    return { ...detail, sinceProjectV2VisitMs: visit };
  }

  function appendEvent(phase: string, mergedDetail?: Record<string, unknown>): void {
    const at = performance.now();
    // performance.mark makes each phase visible in the DevTools Performance timeline.
    try {
      performance.mark(`impasto:${phase}`, mergedDetail ? { detail: mergedDetail } : undefined);
    } catch {
      // Silently ignore: some browsers reject marks with certain characters.
    }
    events.push({
      phase,
      atPerformanceMs: roundMs(at),
      documentElapsedMs: roundMs(at),
      sinceProjectV2VisitMs: visitElapsedMs(),
      detail: mergedDetail,
    });
  }

  function record(phase: string, detail?: Record<string, unknown>): void {
    const merged = mergeVisitDetail(detail);
    appendEvent(phase, merged);
  }

  return {
    record,

    ensureVisitMarked(meta: { visitKey: string; projectIdSuffix: string }): void {
      if (lastProjectV2VisitKey === meta.visitKey) {
        return;
      }
      lastProjectV2VisitKey = meta.visitKey;
      projectV2VisitStartPerformanceMs = performance.now();

      const phase = 'projectv2:visit boundary (before engine/persistence)';
      const merged = {
        projectIdSuffix: meta.projectIdSuffix,
        sinceProjectV2VisitMs: 0,
      };
      appendEvent(phase, merged);
    },

    logNavigationSummaryOnce(marker: { current: boolean }): void {
      if (marker.current) {
        return;
      }
      marker.current = true;

      try {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (!nav || nav.entryType !== 'navigation') {
          record('perf:navigation timing API (no entry)');
          return;
        }

        record('perf:document Navigation Timing summary', buildNavigationTimingSummaryDetail(nav));
      } catch {
        record('perf:navigation timing API (read failed)');
      }
    },

    getSnapshot(): StartupTimingSnapshot {
      return {
        timeOriginMs: performance.timeOrigin,
        projectV2VisitAtPerformanceMs: projectV2VisitStartPerformanceMs,
        lastProjectV2VisitKey,
        events: [...events],
      };
    },

    documentElapsedMsNow(): number {
      return roundMs(performance.now());
    },

    resetForTests(): void {
      events.length = 0;
      projectV2VisitStartPerformanceMs = null;
      lastProjectV2VisitKey = null;
    },
  };
}
