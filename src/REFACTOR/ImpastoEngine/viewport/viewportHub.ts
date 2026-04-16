import type { ViewportTransform } from './models';
import { ListenerRegistry } from '../infra/listenerRegistry';
import type { Viewport } from './Viewport';
import type { ViewportPhysics } from './ViewportPhysics';

/**
 * Owns registered {@link Viewport} surfaces and fans out transform updates from {@link ViewportPhysics}.
 */
export class ViewportHub {
  private readonly physics: ViewportPhysics;
  private readonly observers: Viewport[] = [];
  private readonly transformListeners = new ListenerRegistry<[]>();

  constructor(physics: ViewportPhysics) {
    this.physics = physics;
  }

  subscribe(viewport: Viewport): () => void {
    this.observers.push(viewport);
    viewport.setRequestNewTransform((next) => {
      this.requestTransform(next);
    });
    return () => {
      viewport.setRequestNewTransform(null);
      const i = this.observers.indexOf(viewport);
      if (i !== -1) {
        this.observers.splice(i, 1);
      }
    };
  }

  subscribeTransform(listener: () => void): () => void {
    return this.transformListeners.add(listener);
  }

  setTransform(next: ViewportTransform): void {
    this.physics.setTransform(next);
    for (const v of this.observers) {
      v.notifyTransformChange();
    }
    this.transformListeners.notify();
  }

  requestTransform(next: ViewportTransform): void {
    this.setTransform(next);
  }
}
