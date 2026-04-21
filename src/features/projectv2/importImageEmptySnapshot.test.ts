import { describe, expect, it } from 'vitest';
import { getEmptyDocumentSnapshotForImageImport } from './importImageEmptySnapshot';
import { DEFAULT_INDEX_BLUR_SIGMA } from '../../engine/infra/engineConstants';

describe('project v2 import image empty snapshot', () => {
  it('clears durable fields and uses default index blur sigma', () => {
    const snap = getEmptyDocumentSnapshotForImageImport();
    expect(snap.pins).toEqual([]);
    expect(snap.filters).toEqual([]);
    expect(snap.groups).toEqual([]);
    expect(snap.indexConfig.blurSigma).toBe(DEFAULT_INDEX_BLUR_SIGMA);
  });
});
