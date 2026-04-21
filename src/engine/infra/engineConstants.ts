/**
 * Central numeric defaults for the Impasto engine. Prefer importing from here over scattering literals.
 */

/** Default Gaussian σ for pre-index blur (aligned with legacy `ProjectState.preIndexingBlur`). */
export const DEFAULT_INDEX_BLUR_SIGMA = 3;

/** Default sample-color brush radius in image pixels when the tool is first activated. */
export const DEFAULT_SAMPLE_COLOR_BRUSH_SIZE = 4;

/**
 * Half the visual gap between the inner and outer sample reticle strokes (backing-store pixels).
 */
export const SAMPLE_COLOR_RETICLE_HALF_GAP = 0.75;

/**
 * Throttle window for all continuous user-input paths (pointer drags, filter sliders, tool params).
 * 24 fps ≈ 41 ms — caps CPU without perceptible lag for any gesture.
 */
export const INPUT_THROTTLE_MS = Math.round(1000 / 24);
