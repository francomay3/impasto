import type { ViewportTransform } from './models';
import type { ViewportPhysics } from './ViewportPhysics';

/** Minimal bitmap viewport surface exposed on `ImpastoEngine.viewports`. */
export interface ICanvasViewport {
  readonly canvas: HTMLCanvasElement;
  syncDisplayToHost(): void;
}

/**
 * View surface tied to a {@link ViewportPhysics} instance: reads the canonical transform (no local copy).
 *
 * {@link ImpastoEngine} calls {@link Viewport.notifyTransformChange} after updating physics so dependents can repaint or refresh derived state.
 *
 * Blueprint: align with existing `ViewportState` usage in the canvas layer as responsibilities are split.
 */
export class Viewport {
  private readonly physics: ViewportPhysics;
  private requestNewTransform: ((next: ViewportTransform) => void) | null = null;

  constructor(physics: ViewportPhysics) {
    this.physics = physics;
  }

  get transform(): ViewportTransform {
    return this.physics.transform;
  }

  setRequestNewTransform(handler: ((next: ViewportTransform) => void) | null): void {
    this.requestNewTransform = handler;
  }

  /** Subclasses call this when user interaction should update the canonical viewport transform. */
  protected proposeViewportTransform(next: ViewportTransform): void {
    this.requestNewTransform?.(next);
  }

  notifyTransformChange(): void {}
}
