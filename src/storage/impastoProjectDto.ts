import type { ColorPin } from '../engine/colorPins/ColorPinState';
import type { ColorPinGroup } from '../engine/colorPins/ColorPinGroupState';
import type { PipelineIndexConfig } from '../engine/pipeline/pipelineIndexConfig';
import type { FilterInstance } from '../types';

/** Persisted pigment palette selection and mix tuning for a project. */
export type PigmentSettings = {
  enabledNames: string[];
  minPaintPercent: number;
  deltaThreshold: number;
};

/**
 * Serializable project payload for remote persistence (e.g. Firestore document fields plus a Storage object
 * referenced by {@link ImpastoProjectDto.imageUrl}).
 *
 * **Versioning contract:** Any incompatible change to the shape or meaning of these fields must bump
 * {@link ImpastoProjectDto.schemaVersion} to the next integer and add an explicit migration branch in the mapper
 * (`dtoToSnapshot` / adapter load path). Older `schemaVersion` values are upgraded or rejected with a clear error —
 * never assume unknown versions deserialize correctly.
 */
export type ImpastoProjectDto = {
  schemaVersion: 1;
  pins: ColorPin[];
  filters: FilterInstance[];
  indexConfig: PipelineIndexConfig;
  /** Present on new saves; omitted in legacy stored documents (see mapper / Firestore parser). */
  groups?: readonly ColorPinGroup[];
  /** Present on new saves; absent in legacy documents — mapper supplies defaults when missing. */
  pigmentSettings?: PigmentSettings;
  imageUrl: string | null;
};
