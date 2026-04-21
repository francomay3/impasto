import { afterEach, describe, expect, it, vi } from 'vitest';
import { startImagePrefetch } from './projectImagePrefetch';

describe('projectImagePrefetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls fetch synchronously with the url and an AbortSignal before returning', () => {
    const mockResponse = new Response(null, { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    const url = 'https://example.com/image.png';
    const handle = startImagePrefetch(url);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(handle.promise).toBeInstanceOf(Promise);
    expect(typeof handle.abort).toBe('function');

    return expect(handle.promise).resolves.toBe(mockResponse);
  });

  it('abort() rejects the promise with AbortError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            reject(new Error('expected signal'));
            return;
          }
          if (signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      }),
    );

    const { promise, abort } = startImagePrefetch('https://example.com/a.png');
    abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
