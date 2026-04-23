import { PIGMENTS } from '../../services/ColorMixer';
import type { PigmentSettings } from '../../storage/impastoProjectDto';
import type { Pigment } from '../../types';

export function activePigmentsFromSettings(
  settings: PigmentSettings,
  catalog: readonly Pigment[] = PIGMENTS,
): Pigment[] {
  const enabled = new Set(settings.enabledNames);
  return catalog.filter((p) => enabled.has(p.name));
}
