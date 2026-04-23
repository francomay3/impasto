/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { ProjectState, RawImage } from '../types';
import { ImpastoEngine } from '../engine/core/ImpastoEngine';
import { ImpastoEngineContext } from '../engine/core/ImpastoEngineContext';
import { db, storage } from '../firebase';
import { queryKeys } from '../lib/queryKeys';
import { clearFirestoreProjectImageUrl, renameFirestoreProject, saveFirestoreImageUrl } from '../services/FirestoreService';
import { ensureDashboardThumbnailForEngineProject } from '../storage/ensureDashboardThumbnailForEngineProject';
import { impastoEngineProjectSourceImageStoragePath } from '../storage/firestoreImpastoProjectDoc';
import { FirestoreStorageAdapter } from '../storage/FirestoreStorageAdapter';
import { PersistenceGlue, type PersistenceStatus } from '../storage/PersistenceGlue';
import { ProjectPigmentsState } from '../storage/ProjectPigmentsState';
import { DEFAULT_PIGMENT_NAMES, DEFAULT_MIN_PAINT_PERCENT, DEFAULT_DELTA_THRESHOLD } from '../services/ColorMixer';
import { EnginePaletteResolverSync } from '../features/palette/EnginePaletteResolverSync';
import { logEditorStartupPhase } from '../utils/editorStartupTiming';
import type { HydrationPhase } from './hydrationPhase';

type ImpastoProjectContextValue = {
  /** Where the project shell is between Firestore apply and full image readiness; see `hydrationPhase.ts`. */
  hydrationPhase: HydrationPhase;
  saveStatus: PersistenceStatus;
  /** Dashboard project title from parallel Firestore metadata during glue hydration; empty until initialize settles. */
  projectName: string;
  /** Persists the display title via Firestore and keeps the shell + dashboard list in sync (project v2). */
  renameProjectName: (name: string) => Promise<void>;
  /** Project-level pigment palette and mix settings. Changes auto-save via PersistenceGlue debounce. */
  pigmentsState: ProjectPigmentsState;
};

const ImpastoProjectContext = createContext<ImpastoProjectContextValue | undefined>(undefined);

type ImpastoProjectProviderProps = {
  projectId?: string;
  userId?: string;
  initialSourceImage?: RawImage | null;
  children: ReactNode;
};

/**
 * Owns one {@link ImpastoEngine} per active layout-effect pass and optionally wires Firestore persistence.
 *
 * **React Strict Mode (dev)** runs `useLayoutEffect` setup → cleanup → setup on mount without resetting other hooks.
 * If the engine were created in `useState` / `useMemo` and only `dispose()` ran in cleanup, the same disposed instance
 * would remain in React state and pan/zoom would break. Creating the engine **inside** the effect and calling
 * `setEngine` ties the live instance to the effect pass so the second setup gets a fresh engine.
 */
export function ImpastoProjectProvider({
  projectId,
  userId,
  initialSourceImage,
  children,
}: ImpastoProjectProviderProps) {
  const queryClient = useQueryClient();
  const [engine, setEngine] = useState<ImpastoEngine | null>(null);
  const [pigmentsState] = useState(
    () =>
      new ProjectPigmentsState({
        enabledNames: [...DEFAULT_PIGMENT_NAMES],
        minPaintPercent: DEFAULT_MIN_PAINT_PERCENT,
        deltaThreshold: DEFAULT_DELTA_THRESHOLD,
      }),
  );
  /** First-render seed only: avoids recreating the engine when the parent passes a new `initialSourceImage` reference. */
  const initialSourceImageRef = useRef(initialSourceImage);
  const [hydrationPhase, setHydrationPhase] = useState<HydrationPhase>(() =>
    !projectId || !userId ? 'imageReady' : 'idle'
  );
  const [saveStatus, setSaveStatus] = useState<PersistenceStatus>('idle');
  const [projectName, setProjectName] = useState('');

  const renameProjectName = useCallback(
    async (name: string) => {
      if (!projectId || !userId) {
        return;
      }
      try {
        await renameFirestoreProject(userId, projectId, name);
        setProjectName(name);
        queryClient.setQueryData<ProjectState[]>(queryKeys.projects(userId), (prev = []) =>
          prev.map((p) => (p.id === projectId ? { ...p, name } : p))
        );
      } catch {
        notifications.show({ message: 'Failed to rename project', color: 'red' });
      }
    },
    [projectId, userId, queryClient]
  );

  useLayoutEffect(() => {
    const e = new ImpastoEngine();
    logEditorStartupPhase('engine:ImpastoEngine constructed (layout effect)');
    const seed = initialSourceImageRef.current;
    if (seed !== undefined) {
      e.image.set(seed);
    }
    // Intentional: pairs engine lifetime with this effect so Strict Mode’s cleanup/recreate cycle replaces state.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see module docstring (Strict Mode dispose vs stale state)
    setEngine(e);
    return () => {
      e.dispose();
      // Intentionally omit `setEngine(null)`: in Strict Mode, cleanup and the follow-up setup run in the same
      // layout-effect pass before paint. Clearing engine state here would schedule a render with `null`, causing
      // a visible flash; the next setup immediately calls `setEngine` with a fresh instance, so the disposed
      // engine is never painted.
    };
  }, []);

  useEffect(() => {
    if (!engine || !projectId || !userId) {
      return;
    }

    // Intentional reset: when deps change we must clear hydration state synchronously before
    // glue.initialize() resolves, otherwise stale `true` persists briefly.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrationPhase('idle');
    // Reset pigments to defaults so stale project settings aren't shown while the new one loads.
    pigmentsState.reset();

    setProjectName('');

    const adapter = new FirestoreStorageAdapter(db, storage, userId);
    let glue: PersistenceGlue;
    try {
      glue = new PersistenceGlue(engine, adapter, {
        projectMetadataAdapter: adapter,
        projectPigmentsState: pigmentsState,
        onEngineSourceImageTouch: async ({ projectId: pid, kind }) => {
          if (kind === 'uploaded') {
            await saveFirestoreImageUrl(
              userId,
              pid,
              impastoEngineProjectSourceImageStoragePath(userId, pid)
            );
          } else {
            await clearFirestoreProjectImageUrl(userId, pid);
          }
          await queryClient.invalidateQueries({ queryKey: queryKeys.projects(userId) });
        },
      });
    } catch {
      return;
    }

    const unsubStatus = glue.subscribeStatus(setSaveStatus);
    let cancelled = false;
    const glueT0 = performance.now();
    logEditorStartupPhase('glue:initialize requested (Firestore + hydrate)');
    void glue
      .initialize(projectId, {
        onStructuralReady: () => {
          if (!cancelled) {
            setHydrationPhase('structural');
          }
        },
      })
      .finally(() => {
        logEditorStartupPhase('glue:initialize promise settled', {
          glueWallMs: Math.round((performance.now() - glueT0) * 10) / 10,
        });
        if (!cancelled) {
          setHydrationPhase('imageReady');
          setProjectName(glue.projectName);
          if (engine.image.get() !== null) {
            void ensureDashboardThumbnailForEngineProject(userId, projectId).then((didWrite) => {
              if (didWrite) {
                void queryClient.invalidateQueries({ queryKey: queryKeys.projects(userId) });
              }
            });
          }
        }
      });

    return () => {
      cancelled = true;
      unsubStatus();
      glue.dispose();
    };
  }, [engine, projectId, userId, queryClient, pigmentsState]);

  if (!engine) {
    return null;
  }

  return (
    <ImpastoEngineContext.Provider value={engine}>
      <ImpastoProjectContext.Provider
        value={{ hydrationPhase, saveStatus, projectName, renameProjectName, pigmentsState }}
      >
        <EnginePaletteResolverSync />
        {children}
      </ImpastoProjectContext.Provider>
    </ImpastoEngineContext.Provider>
  );
}

export function useImpastoProject(): ImpastoProjectContextValue {
  const ctx = useContext(ImpastoProjectContext);
  if (ctx === undefined) {
    throw new Error('useImpastoProject must be used within ImpastoProjectProvider');
  }
  return ctx;
}
