/**
 * Progressive hydration for the editor shell vs the source image.
 *
 * - `idle`: persistence not finished applying engine state (or not started).
 * - `structural`: engine document is applied; image fetch may still be in flight.
 * - `imageReady`: glue hydration complete (image decoded and applied where applicable).
 *
 * The provider advances phases as persistence callbacks fire; see `ImpastoProjectProvider`.
 */
export type HydrationPhase = 'idle' | 'structural' | 'imageReady';
