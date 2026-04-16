import { describe, expect, it } from 'vitest';
import { countEffectiveLinesInText, mergeRanges } from './check-file-length';

describe('mergeRanges', () => {
  it('merges overlapping and adjacent spans', () => {
    expect(mergeRanges([])).toEqual([]);
    expect(mergeRanges([{ pos: 0, end: 2 }])).toEqual([{ pos: 0, end: 2 }]);
    expect(
      mergeRanges([
        { pos: 0, end: 2 },
        { pos: 1, end: 3 },
        { pos: 5, end: 6 },
      ]),
    ).toEqual([
      { pos: 0, end: 3 },
      { pos: 5, end: 6 },
    ]);
  });
});

describe('countEffectiveLinesInText', () => {
  it('counts physical lines when there is no blank or comment-only content', () => {
    const lines = ['a', 'b', 'c'].join('\n');
    expect(lines.split('\n').length).toBe(3);
    expect(countEffectiveLinesInText(lines, 'x.ts')).toBe(3);
  });

  it('does not count empty lines or lines that are only a newline (CRLF inner segment)', () => {
    const src = ['const x = 1;', '', '  ', '\t\t', '', 'const y = 2;'].join('\n');
    expect(src.split('\n').length).toBe(6);
    expect(countEffectiveLinesInText(src, 'x.ts')).toBe(2);
  });

  it('does not count lines that are only // or block comment trivia', () => {
    const src = [
      'export const a = 1;',
      '// full line comment',
      '/* also block full line */',
      '',
      '/**',
      ' * doc only',
      ' */',
      'export const b = 2;',
    ].join('\n');
    expect(countEffectiveLinesInText(src, 'x.ts')).toBe(2);
  });

  it('counts a line that mixes code and trailing // comment as one effective line', () => {
    const src = ['const n = 1; // trailing'].join('\n');
    expect(countEffectiveLinesInText(src, 'x.ts')).toBe(1);
  });

  it('does not treat // inside a string as starting a line comment', () => {
    const src = ['const s = "// not a comment";'].join('\n');
    expect(countEffectiveLinesInText(src, 'x.ts')).toBe(1);
  });

  it('handles block comments that span multiple lines without counting inner lines', () => {
    const src = ['const a = 1;', '/*', 'line in block', '*/', 'const b = 2;'].join('\n');
    expect(countEffectiveLinesInText(src, 'x.ts')).toBe(2);
  });

  it('ignores whitespace-only lines that include the line-terminating newline in the span', () => {
    // Regression: per-line spans are [lineStart, nextLineStart) and include the LF;
    // those must not count as "code".
    const src = 'const a = 1;\n\nconst b = 2;\n';
    expect(countEffectiveLinesInText(src, 'x.ts')).toBe(2);
  });
});
