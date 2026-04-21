/**
 * Pure combinations of per-tool input caps and per-surface caps (no tool registry).
 */

export type ViewportSurfaceId = 'source' | 'filtered' | 'indexed';

export type ToolInputCaps = {
  primaryButtonDragPan: boolean;
  wheelZoom: boolean;
  primaryClickColorSample: boolean;
};

type SurfaceInputCaps = {
  panZoom: boolean;
  colorSamplePin: boolean;
  marqueeSelect: boolean;
};

const SURFACE_INPUT_CAPS: Record<ViewportSurfaceId, SurfaceInputCaps> = {
  source: { panZoom: true, colorSamplePin: false, marqueeSelect: false },
  filtered: { panZoom: true, colorSamplePin: true, marqueeSelect: true },
  indexed: { panZoom: true, colorSamplePin: true, marqueeSelect: true },
};

export function allowsPrimaryDragPan(surface: ViewportSurfaceId, caps: ToolInputCaps): boolean {
  return caps.primaryButtonDragPan && SURFACE_INPUT_CAPS[surface].panZoom;
}

export function allowsWheelZoom(surface: ViewportSurfaceId, caps: ToolInputCaps): boolean {
  return caps.wheelZoom && SURFACE_INPUT_CAPS[surface].panZoom;
}

export function allowsPrimaryClickColorSample(
  surface: ViewportSurfaceId,
  caps: ToolInputCaps,
): boolean {
  return caps.primaryClickColorSample && SURFACE_INPUT_CAPS[surface].colorSamplePin;
}

/** When the tool’s primary action is color sampling but this surface forbids pins, allow pan/zoom anyway. */
function navigationWhenSampleUnavailableOnSurface(
  surface: ViewportSurfaceId,
  caps: ToolInputCaps,
): boolean {
  return (
    caps.primaryClickColorSample &&
    !SURFACE_INPUT_CAPS[surface].colorSamplePin &&
    SURFACE_INPUT_CAPS[surface].panZoom
  );
}

export function effectivePrimaryDragPan(surface: ViewportSurfaceId, caps: ToolInputCaps): boolean {
  return allowsPrimaryDragPan(surface, caps) || navigationWhenSampleUnavailableOnSurface(surface, caps);
}

export function effectiveWheelZoom(surface: ViewportSurfaceId, caps: ToolInputCaps): boolean {
  return allowsWheelZoom(surface, caps) || navigationWhenSampleUnavailableOnSurface(surface, caps);
}

export function allowsMiddleButtonDragPan(surface: ViewportSurfaceId): boolean {
  return SURFACE_INPUT_CAPS[surface].panZoom;
}

/** Marquee selection is only meaningful on surfaces that show filtered-space pins. */
export function allowsMarqueeSelect(surface: ViewportSurfaceId, _caps: ToolInputCaps): boolean {
  return SURFACE_INPUT_CAPS[surface].marqueeSelect;
}
