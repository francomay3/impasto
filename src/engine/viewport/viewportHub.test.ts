import { describe, expect, it } from 'vitest';
import { ViewportHub } from './viewportHub';
import { ViewportPhysics } from './ViewportPhysics';

describe('ViewportHub', () => {
  it('round-trips viewport size via setter and getter', () => {
    const hub = new ViewportHub(new ViewportPhysics());
    expect(hub.getViewportSize()).toBeNull();
    hub.setViewportSize(320, 240);
    expect(hub.getViewportSize()).toEqual({ width: 320, height: 240 });
    hub.setViewportSize(100, 200);
    expect(hub.getViewportSize()).toEqual({ width: 100, height: 200 });
  });
});
