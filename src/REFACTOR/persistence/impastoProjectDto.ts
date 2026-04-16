import type { ColorPin } from '../ImpastoEngine/colorPins/ColorPinState';
import type { PipelineIndexConfig } from '../ImpastoEngine/pipeline/pipelineIndexConfig';
import type { FilterInstance } from '../../types';

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
  imageUrl: string | null;
};
