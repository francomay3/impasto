import type { ImpastoDocumentSnapshot } from '../../engine/core/impastoDocumentSnapshot';
import { DEFAULT_INDEX_BLUR_SIGMA } from '../../engine/infra/engineConstants';

/** Fresh durable document used when replacing the source image via File → {@link ImpastoEngine.loadDocument}. */
export function getEmptyDocumentSnapshotForImageImport(): ImpastoDocumentSnapshot {
  return {
    pins: [],
    filters: [],
    indexConfig: { blurSigma: DEFAULT_INDEX_BLUR_SIGMA },
    groups: [],
  };
}
