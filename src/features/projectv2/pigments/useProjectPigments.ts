import { useSyncExternalStore } from 'react';
import { useImpastoProject } from '../../../providers/ImpastoProjectProvider';
import type { PigmentSettings } from '../../../storage/impastoProjectDto';

export type { PigmentSettings };

/**
 * Subscribes to the project-level pigment settings.
 * Returns a stable snapshot for rendering and the state object for mutations.
 */
export function useProjectPigments() {
  const { pigmentsState } = useImpastoProject();
  const settings = useSyncExternalStore(
    (cb) => pigmentsState.subscribe(cb),
    () => pigmentsState.getSnapshot(),
  );
  return { settings, pigmentsState };
}
