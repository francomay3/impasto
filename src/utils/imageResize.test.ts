import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('heic2any', () => ({ default: vi.fn() }));

import heic2any from 'heic2any';
import { withWebpExtension, isHeic, prepareImage } from './imageResize';

describe('withWebpExtension', () => {
  it('replaces a known extension with .webp', () => {
    expect(withWebpExtension('photo.jpg')).toBe('photo.webp');
    expect(withWebpExtension('image.jpeg')).toBe('image.webp');
    expect(withWebpExtension('picture.png')).toBe('picture.webp');
    expect(withWebpExtension('file.PNG')).toBe('file.webp');
  });

  it('replaces the last dot-separated segment', () => {
    expect(withWebpExtension('my.photo.jpg')).toBe('my.photo.webp');
  });

  it('appends .webp when there is no extension', () => {
    expect(withWebpExtension('noextension')).toBe('noextension.webp');
  });

  it('handles a filename that is only an extension', () => {
    expect(withWebpExtension('.gitignore')).toBe('.webp');
  });

  it('handles empty string', () => {
    expect(withWebpExtension('')).toBe('.webp');
  });
});

describe('prepareImage', () => {
  const mockCtx = { drawImage: vi.fn() };
  const mockBlob = new Blob(['img'], { type: 'image/webp' });
  const mockCanvas = {
    width: 0, height: 0,
    getContext: vi.fn().mockReturnValue(mockCtx),
    toBlob: vi.fn().mockImplementation((cb: (b: Blob | null) => void) => cb(mockBlob)),
  };

  beforeAll(() => {
    vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(mockCanvas) });
  });
  afterAll(() => vi.unstubAllGlobals());

  it('returns webpFile with correct name and type for a jpeg', async () => {
    vi.stubGlobal('createImageBitmap',
      vi.fn().mockResolvedValueOnce({ width: 100, height: 100, close: vi.fn() })
             .mockResolvedValueOnce({ width: 100, height: 100 }),
    );
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const { webpFile } = await prepareImage(file);
    expect(webpFile.name).toBe('photo.webp');
    expect(webpFile.type).toBe('image/webp');
  });

  it('scales down images larger than 2 megapixels', async () => {
    vi.stubGlobal('createImageBitmap',
      vi.fn().mockResolvedValueOnce({ width: 2000, height: 2000, close: vi.fn() })
             .mockResolvedValueOnce({ width: 1414, height: 1414 }),
    );
    const file = new File(['data'], 'big.jpg', { type: 'image/jpeg' });
    await prepareImage(file);
    // canvas dimensions should be scaled down from 2000x2000
    expect(mockCanvas.width).toBeLessThan(2000);
    expect(mockCanvas.height).toBeLessThan(2000);
  });

  it('converts HEIC files via heic2any before processing', async () => {
    const heicBlob = new Blob(['heic'], { type: 'image/jpeg' });
    (heic2any as ReturnType<typeof vi.fn>).mockResolvedValueOnce(heicBlob);
    vi.stubGlobal('createImageBitmap',
      vi.fn().mockResolvedValueOnce({ width: 100, height: 100, close: vi.fn() })
             .mockResolvedValueOnce({ width: 100, height: 100 }),
    );
    const file = new File(['data'], 'photo.heic', { type: 'image/heic' });
    const { webpFile } = await prepareImage(file);
    expect(heic2any).toHaveBeenCalled();
    expect(webpFile.name).toBe('photo.webp');
  });

  it('rejects when canvas toBlob returns null', async () => {
    mockCanvas.toBlob.mockImplementationOnce((cb: (b: Blob | null) => void) => cb(null));
    vi.stubGlobal('createImageBitmap',
      vi.fn().mockResolvedValueOnce({ width: 100, height: 100, close: vi.fn() }),
    );
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(prepareImage(file)).rejects.toThrow('Canvas toBlob failed');
  });
});

describe('isHeic', () => {
  const file = (name: string, type: string) => new File([], name, { type });

  it('detects image/heic MIME type', () => {
    expect(isHeic(file('photo.heic', 'image/heic'))).toBe(true);
  });

  it('detects image/heif MIME type', () => {
    expect(isHeic(file('photo.heif', 'image/heif'))).toBe(true);
  });

  it('detects .heic extension with empty MIME type (some browsers)', () => {
    expect(isHeic(file('photo.HEIC', ''))).toBe(true);
  });

  it('detects .heif extension with empty MIME type', () => {
    expect(isHeic(file('photo.HEIF', ''))).toBe(true);
  });

  it('returns false for regular JPEG', () => {
    expect(isHeic(file('photo.jpg', 'image/jpeg'))).toBe(false);
  });

  it('returns false for PNG', () => {
    expect(isHeic(file('photo.png', 'image/png'))).toBe(false);
  });
});
