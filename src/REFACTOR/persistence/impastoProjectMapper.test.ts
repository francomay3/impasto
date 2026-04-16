import { describe, expect, it } from 'vitest';
import type { ImpastoDocumentSnapshot } from '../ImpastoEngine/core/impastoDocumentSnapshot';
import type { ImpastoProjectDto } from './impastoProjectDto';
import { dtoToSnapshot, snapshotToDto } from './impastoProjectMapper';

function assertSnapshotStructurallyEqual(
  original: ImpastoDocumentSnapshot,
  roundtrip: ImpastoDocumentSnapshot
): void {
  expect([...original.pins]).toEqual([...roundtrip.pins]);
  expect([...original.filters]).toEqual([...roundtrip.filters]);
  expect({ ...original.indexConfig }).toEqual({ ...roundtrip.indexConfig });
}

describe('impastoProjectMapper', () => {
  it('snapshotToDto → dtoToSnapshot is structurally equal (empty document)', () => {
    const snapshot: ImpastoDocumentSnapshot = {
      pins: Object.freeze([]),
      filters: Object.freeze([]),
      indexConfig: Object.freeze({ blurSigma: 3 }),
    };
    const dto = snapshotToDto(snapshot, null);
    const again = dtoToSnapshot(dto);
    assertSnapshotStructurallyEqual(snapshot, again);
  });

  it('snapshotToDto → dtoToSnapshot is structurally equal (pins, filters, index)', () => {
    const snapshot: ImpastoDocumentSnapshot = {
      pins: Object.freeze([
        Object.freeze({
          id: 'pin-a',
          imageX: 10,
          imageY: 20,
          radiusPx: 4,
          color: '#aabbcc',
        }),
      ]),
      filters: Object.freeze([
        Object.freeze({
          id: 'mapper-filter',
          type: 'brightness-contrast' as const,
          params: { brightness: 1, contrast: -2 },
          enabled: true,
        }),
      ]),
      indexConfig: Object.freeze({ blurSigma: 7.5 }),
    };
    const dto = snapshotToDto(snapshot, 'https://example.com/image.png');
    const again = dtoToSnapshot(dto);
    assertSnapshotStructurallyEqual(snapshot, again);
    expect(dto.imageUrl).toBe('https://example.com/image.png');
  });

  it('dtoToSnapshot rejects unsupported schemaVersion', () => {
    const dto = {
      schemaVersion: 99,
      pins: [],
      filters: [],
      indexConfig: { blurSigma: 1 },
      imageUrl: null,
    } as unknown as ImpastoProjectDto;
    expect(() => dtoToSnapshot(dto)).toThrow(/Unsupported ImpastoProjectDto schemaVersion/);
  });
});
