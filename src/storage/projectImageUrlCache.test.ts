// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { getCachedImageUrl, setCachedImageUrl } from './projectImageUrlCache';

const PREFIX = 'impasto:v1:projectImageUrl:';

function keyFor(projectId: string): string {
  return `${PREFIX}${encodeURIComponent(projectId)}`;
}

describe('projectImageUrlCache', () => {
  afterEach(() => {
    try {
      const ls = globalThis.localStorage;
      const toRemove: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k !== null && k.startsWith(PREFIX)) {
          toRemove.push(k);
        }
      }
      for (const k of toRemove) {
        ls.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  });

  it('returns null on cache miss', () => {
    expect(getCachedImageUrl('proj-no-cache')).toBeNull();
  });

  it('set then get returns the stored URL', () => {
    const url = 'https://example.com/bucket/image.png?token=abc';
    setCachedImageUrl('my-project', url);
    expect(getCachedImageUrl('my-project')).toBe(url);
    expect(globalThis.localStorage.getItem(keyFor('my-project'))).toBe(url);
  });

  it('isolates entries by project id', () => {
    setCachedImageUrl('a', 'https://a.test/1.png');
    setCachedImageUrl('b', 'https://b.test/2.png');
    expect(getCachedImageUrl('a')).toBe('https://a.test/1.png');
    expect(getCachedImageUrl('b')).toBe('https://b.test/2.png');
  });

  it('treats empty stored value as cache miss', () => {
    globalThis.localStorage.setItem(keyFor('empty-val'), '');
    expect(getCachedImageUrl('empty-val')).toBeNull();
  });
});
