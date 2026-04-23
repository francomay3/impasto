import { describe, expect, it, vi } from 'vitest';
import { createRawImage, type RawImage } from '../../types';
import { buildViewportApi } from './buildEngineApis';
import { ViewportHub } from '../viewport/viewportHub';
import { ViewportPhysics } from '../viewport/ViewportPhysics';
function makeApi(getImage: () => RawImage | null) {
  const physics = new ViewportPhysics();
  const hub = new ViewportHub(physics);
  return {
    api: buildViewportApi({
      physics,
      hub,
      ensureLive: () => {},
      getImage,
    }),
    hub,
  };
}

describe('buildViewportApi.fitToImage', () => {
  it('returns false when viewport size is unknown', () => {
    const img = createRawImage(new Uint8ClampedArray(40 * 20 * 4), 40, 20);
    const { api, hub } = makeApi(() => img);
    vi.spyOn(hub, 'requestTransform');
    expect(api.fitToImage()).toBe(false);
    expect(hub.requestTransform).not.toHaveBeenCalled();
  });

  it('returns false when image is null', () => {
    const { api, hub } = makeApi(() => null);
    api.setViewportSize(100, 100);
    vi.spyOn(hub, 'requestTransform');
    expect(api.fitToImage()).toBe(false);
    expect(hub.requestTransform).not.toHaveBeenCalled();
  });

  it('returns false when stored size is non-positive', () => {
    const img = createRawImage(new Uint8ClampedArray(10 * 10 * 4), 10, 10);
    const { api, hub } = makeApi(() => img);
    hub.setViewportSize(0, 100);
    vi.spyOn(hub, 'requestTransform');
    expect(api.fitToImage()).toBe(false);
  });

  it('applies fitToContain via requestTransform when image and size exist', () => {
    const img = createRawImage(new Uint8ClampedArray(200 * 100 * 4), 200, 100);
    const { api, hub } = makeApi(() => img);
    api.setViewportSize(400, 400);
    const spy = vi.spyOn(hub, 'requestTransform');
    expect(api.fitToImage()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    const t = spy.mock.calls[0][0];
    expect(t.z).toBe(2);
    expect(t.x).toBe(0);
    expect(t.y).toBe(100);
  });
});
