import { createRawImage, type RawImage } from '../../types';

/** Shallow null check plus width/height/byte equality (engine copies on `set`, so references alone are not enough). */
export function rawImageContentEquals(a: RawImage | null, b: RawImage | null): boolean {
  if (a === b) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  if (a.width !== b.width || a.height !== b.height) {
    return false;
  }
  const ad = a.data;
  const bd = b.data;
  if (ad.length !== bd.length) {
    return false;
  }
  for (let i = 0; i < ad.length; i++) {
    if (ad[i] !== bd[i]) {
      return false;
    }
  }
  return true;
}

/** Deep copy for persistence bookkeeping after a successful save. */
export function cloneRawImage(src: RawImage | null): RawImage | null {
  if (src === null) {
    return null;
  }
  return createRawImage(new Uint8ClampedArray(src.data), src.width, src.height);
}
