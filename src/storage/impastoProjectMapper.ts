import type { ImpastoDocumentSnapshot } from '../engine/core/impastoDocumentSnapshot';
import type { ImpastoProjectDto, PigmentSettings } from './impastoProjectDto';
import { DEFAULT_PIGMENT_NAMES, DEFAULT_MIN_PAINT_PERCENT, DEFAULT_DELTA_THRESHOLD } from '../services/ColorMixer';

/**
 * Extracts pigment settings from a DTO, filling defaults when the field is absent
 * (legacy documents pre-date this field).
 */
export function dtoToPigmentSettings(dto: ImpastoProjectDto): PigmentSettings {
  return dto.pigmentSettings ?? {
    enabledNames: [...DEFAULT_PIGMENT_NAMES],
    minPaintPercent: DEFAULT_MIN_PAINT_PERCENT,
    deltaThreshold: DEFAULT_DELTA_THRESHOLD,
  };
}

/**
 * Maps an in-memory engine document snapshot plus the adapter-owned image URL into a
 * versioned DTO suitable for JSON storage (e.g. Firestore).
 */
export function snapshotToDto(
  snapshot: ImpastoDocumentSnapshot,
  imageUrl: string | null
): ImpastoProjectDto {
  return {
    schemaVersion: 1,
    pins: structuredClone([...snapshot.pins]),
    filters: structuredClone([...snapshot.filters]),
    indexConfig: structuredClone(snapshot.indexConfig),
    groups: structuredClone([...snapshot.groups]),
    imageUrl,
  };
}

/**
 * Maps a persisted DTO back into an engine document snapshot. {@link ImpastoProjectDto.imageUrl}
 * is adapter-owned and is not part of the snapshot.
 *
 * @throws If {@link ImpastoProjectDto.schemaVersion} is not supported — add a migration branch
 *   here (and in the storage adapter) when incrementing the schema.
 */
export function dtoToSnapshot(dto: ImpastoProjectDto): ImpastoDocumentSnapshot {
  // DTOs may come from untyped JSON at runtime; compare as number so unknown versions surface.
  const schemaVersion = dto.schemaVersion as number;
  if (schemaVersion !== 1) {
    throw new Error(
      `Unsupported ImpastoProjectDto schemaVersion: ${String(schemaVersion)} (expected 1). ` +
        'Add a migration branch in impastoProjectMapper.dtoToSnapshot when bumping the schema.'
    );
  }

  const pins = Object.freeze(structuredClone(dto.pins));
  const filters = Object.freeze(structuredClone(dto.filters));
  const indexConfig = Object.freeze(structuredClone(dto.indexConfig));
  const groups = Object.freeze(structuredClone([...(dto.groups ?? [])]));
  return Object.freeze({ pins, filters, indexConfig, groups });
}
