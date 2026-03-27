import { describe, it, expect } from 'vitest'
import { withWebpExtension } from './imageResize'

describe('withWebpExtension', () => {
  it('replaces a known extension with .webp', () => {
    expect(withWebpExtension('photo.jpg')).toBe('photo.webp')
    expect(withWebpExtension('image.jpeg')).toBe('image.webp')
    expect(withWebpExtension('picture.png')).toBe('picture.webp')
    expect(withWebpExtension('file.PNG')).toBe('file.webp')
  })

  it('replaces the last dot-separated segment', () => {
    expect(withWebpExtension('my.photo.jpg')).toBe('my.photo.webp')
  })

  it('appends .webp when there is no extension', () => {
    expect(withWebpExtension('noextension')).toBe('noextension.webp')
  })

  it('handles a filename that is only an extension', () => {
    expect(withWebpExtension('.gitignore')).toBe('.webp')
  })

  it('handles empty string', () => {
    expect(withWebpExtension('')).toBe('.webp')
  })
})
