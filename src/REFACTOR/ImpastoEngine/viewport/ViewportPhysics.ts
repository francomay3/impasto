import type { ViewportTransform } from './models';

/**
 * Viewport motion and constraints (pan, zoom, bounds, inertia, etc.), decoupled from React and from canvas rendering.
 *
 * Holds the canonical transform; {@link ImpastoEngine} commits changes and fans out notifications to {@link Viewport} instances.
 *
 * Blueprint: migrate logic from the canvas viewport layer incrementally; flesh out the API as the refactor proceeds.
 */
export class ViewportPhysics {
  private _transform: ViewportTransform = { x: 0, y: 0, z: 1 };

  get transform(): ViewportTransform {
    // Return the stored reference directly — callers must not mutate it.
    // This is intentional: useSyncExternalStore relies on reference stability
    // to avoid spurious re-renders (setTransform always writes a new object).
    return this._transform;
  }

  setTransform(next: ViewportTransform): void {
    this._transform = { ...next };
  }
}
