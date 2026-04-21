import type { RawImage } from '../types';
import type { ImpastoEngine } from '../engine/core/ImpastoEngine';
import type { IStorageAdapter } from './IStorageAdapter';
import type { IProjectMetadataAdapter } from './IProjectMetadataAdapter';
import { snapshotToDto } from './impastoProjectMapper';
import { cloneRawImage, rawImageContentEquals } from './rawImageCompare';
import { loadPersistedDtoIntoEngine } from './persistenceGlueLoadPersisted';
import type { ProjectPigmentsState } from './ProjectPigmentsState';

const DEFAULT_DOCUMENT_DEBOUNCE_MS = 1_500;

/** Autosave lifecycle for UI or logging; see {@link PersistenceGlue.subscribeStatus}. */
export type PersistenceStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Optional hooks passed to {@link PersistenceGlue.initialize}. */
type PersistenceGlueInitializeOptions = {
  /** Fires after the engine DTO is applied and before the remote image fetch/decode (see `loadPersistedDtoIntoEngine`). */
  onStructuralReady?: () => void;
};

export type { PersistenceGlueInitializeOptions };

/** Fired after a successful engine {@link IStorageAdapter.save} that uploaded or deleted remote source bytes. */
export type EngineSourceImageDashboardTouch = {
  projectId: string;
  kind: 'uploaded' | 'deleted';
};

type PersistenceGlueOptions = {
  /**
   * Milliseconds to wait after the last document-changed signal before the debounced save path runs.
   * @default 1500
   */
  debounceMs?: number;
  /**
   * Sync `users/{userId}/projects/{projectId}.imageStorageUrl` with engine Storage (project v2),
   * since the engine DTO lives under `impasto_engine_projects` and does not update the dashboard row by itself.
   */
  onEngineSourceImageTouch?: (touch: EngineSourceImageDashboardTouch) => void | Promise<void>;
  /**
   * When set, {@link PersistenceGlue.initialize} fetches project metadata in parallel with the engine DTO,
   * and {@link PersistenceGlue.updateProjectName} persists name changes without engine snapshot involvement.
   */
  projectMetadataAdapter?: IProjectMetadataAdapter;
  /**
   * When set, pigment setting changes trigger debounced saves and the state is hydrated from the DTO
   * on {@link PersistenceGlue.initialize}. The engine is never involved.
   */
  projectPigmentsState?: ProjectPigmentsState;
};

/**
 * Wires {@link ImpastoEngine} document snapshots to an {@link IStorageAdapter} (debounced autosave, hydration).
 */
export class PersistenceGlue {
  private readonly engine: ImpastoEngine;
  private readonly adapter: IStorageAdapter;
  private readonly _projectMetadataAdapter: IProjectMetadataAdapter | undefined;
  private readonly debounceMs: number;
  private readonly _onEngineSourceImageTouch?: (
    touch: EngineSourceImageDashboardTouch
  ) => void | Promise<void>;

  /** Set by {@link PersistenceGlue.initialize} once a project is known. */
  private _projectId: string | null = null;
  /**
   * Dashboard `projects/{id}` display name from the parallel metadata fetch during hydration;
   * `''` when no `projectMetadataAdapter` was supplied, metadata failed, or before `initialize` completes.
   */
  private _projectName = '';
  /**
   * True when a debounced flush arrived while the coalescing save chain was already running.
   * The chain re-runs once after the current save completes.
   */
  private _pendingDirty = false;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** Populated when document subscription is wired; cleared in {@link PersistenceGlue.dispose}. */
  private _unsubscribeDocument: (() => void) | null = null;
  private _unsubscribePigments: (() => void) | null = null;
  private readonly _pigmentsState: ProjectPigmentsState | undefined;
  /** Ensures at most one coalescing flush chain runs at a time (avoids parallel overlapping saves). */
  private _coalescingRun: Promise<void> | null = null;
  /** URL last written by a successful {@link IStorageAdapter.save} for this glue instance. */
  private _lastPersistedImageUrl: string | null = null;
  /** Pixel copy last persisted (used to skip delete/upload when only document fields changed). */
  private _lastSavedImageCopy: RawImage | null = null;

  private _status: PersistenceStatus = 'idle';
  private readonly _statusListeners = new Set<(s: PersistenceStatus) => void>();

  constructor(engine: ImpastoEngine, adapter: IStorageAdapter, options?: PersistenceGlueOptions) {
    this.engine = engine;
    this.adapter = adapter;
    this._projectMetadataAdapter = options?.projectMetadataAdapter;
    this.debounceMs = options?.debounceMs ?? DEFAULT_DOCUMENT_DEBOUNCE_MS;
    this._onEngineSourceImageTouch = options?.onEngineSourceImageTouch;
    this._pigmentsState = options?.projectPigmentsState;

    this._unsubscribeDocument = engine.subscribeDocumentChanged(() => {
      this._onDocumentChanged();
    });
    if (this._pigmentsState) {
      this._unsubscribePigments = this._pigmentsState.subscribe(() => {
        this._onDocumentChanged();
      });
    }
  }

  /**
   * Subscribe to {@link PersistenceStatus} transitions: `idle` → `saving` when a persist starts;
   * `saving` → `saved` on success; `saving` → `error` on failure. The listener is invoked once
   * immediately with the current status, then on each change.
   */
  subscribeStatus(listener: (s: PersistenceStatus) => void): () => void {
    this._statusListeners.add(listener);
    listener(this._status);
    return () => {
      this._statusListeners.delete(listener);
    };
  }

  /** Display title from the dashboard project doc hydrate path; stable for the lifetime of this glue instance after {@link initialize}. */
  get projectName(): string {
    return this._projectName;
  }

  /**
   * Loads persisted document state when a record exists, then stores `projectId` for debounced saves.
   * Fetches and decodes the stored image (if any) and passes it to `engine.loadDocument` so the image
   * is hydrated in the same call. URL and pixel bookkeeping are synced so the first save after hydration
   * does not spuriously delete or re-upload when the in-memory image already matches what was persisted.
   *
   * When a `projectMetadataAdapter` was supplied at construction time, the metadata fetch runs in
   * parallel with the engine DTO read so both Firestore round-trips overlap.
   */
  async initialize(
    projectId: string,
    options?: PersistenceGlueInitializeOptions,
  ): Promise<void> {
    this._projectId = projectId;
    const book = await loadPersistedDtoIntoEngine(this.engine, this.adapter, projectId, {
      projectMetadataAdapter: this._projectMetadataAdapter,
      onStructuralReady: options?.onStructuralReady,
    });
    this._lastPersistedImageUrl = book.lastPersistedImageUrl;
    this._lastSavedImageCopy = book.lastSavedImageCopy;
    this._projectName = book.projectName;
    if (this._pigmentsState && book.pigmentSettings) {
      this._pigmentsState.loadSettings(book.pigmentSettings);
    }
  }

  /**
   * Persists a display-name change for this project via the `projectMetadataAdapter`.
   * This is an imperative, non-debounced save — it has no relation to the engine snapshot path.
   * Resolves when Firestore confirms the write. Throws on failure.
   */
  async updateProjectName(name: string): Promise<void> {
    if (!this._projectMetadataAdapter || !this._projectId) {
      return;
    }
    this._setStatus('saving');
    try {
      await this._projectMetadataAdapter.saveProjectMetadata(this._projectId, { name });
      this._projectName = name;
      this._setStatus('saved');
    } catch (err) {
      console.error('[persistence] rename error:', err);
      this._setStatus('error');
      throw err;
    }
  }

  dispose(): void {
    this._clearDebounceTimer();
    this._unsubscribeDocument?.();
    this._unsubscribeDocument = null;
    this._unsubscribePigments?.();
    this._unsubscribePigments = null;
    this._statusListeners.clear();
    this._projectName = '';
  }

  private _clearDebounceTimer(): void {
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }

  private _setStatus(next: PersistenceStatus): void {
    if (this._status === next) {
      return;
    }
    this._status = next;
    for (const listener of this._statusListeners) {
      listener(next);
    }
  }

  private _onDocumentChanged(): void {
    this._clearDebounceTimer();
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      this._onDebounceElapsed();
    }, this.debounceMs);
  }

  /**
   * Invoked after {@link debounceMs} of document quiet. Starts or extends the coalescing save chain so snapshot reads
   * always happen at flush time (inside {@link _performSaveAtFireTime}), not when the debounce timer was scheduled.
   */
  private _onDebounceElapsed(): void {
    if (this._coalescingRun !== null) {
      this._pendingDirty = true;
      return;
    }
    const run = this._runCoalescingSaveChain();
    this._coalescingRun = run;
    void run.finally(() => {
      this._coalescingRun = null;
    });
  }

  /**
   * Runs one or more saves in sequence: each iteration clears {@link _pendingDirty} for that pass, performs a save
   * that reads engine state at await time, then repeats if another debounced flush arrived while saving.
   */
  private async _runCoalescingSaveChain(): Promise<void> {
    do {
      this._pendingDirty = false;
      await this._performSaveAtFireTime();
    } while (this._pendingDirty);
  }

  /**
   * Persists the current engine document. Snapshot and image reads happen here so each flush sees the latest state.
   */
  private async _performSaveAtFireTime(): Promise<void> {
    const projectId = this._projectId;
    if (projectId === null) {
      return;
    }

    this._setStatus('saving');
    try {
      const snapshot = this.engine.getDocumentSnapshot();
      const currentImage = this.engine.image.get();
      const pixelsDiffer = !rawImageContentEquals(currentImage, this._lastSavedImageCopy);
      /**
       * Firestore can still reference a Storage URL while the engine has no pixels (hydration fetch failed, or URL
       * invalidated server-side). Pixel equality would be trivially true for null/null — still persist a cleanup.
       */
      const orphanedPersistedUrl =
        currentImage === null && this._lastPersistedImageUrl !== null;
      const imageChanged = pixelsDiffer || orphanedPersistedUrl;

      let imageUrl = this._lastPersistedImageUrl;
      let engineSourceTouch: EngineSourceImageDashboardTouch['kind'] | null = null;
      if (imageChanged) {
        if (currentImage !== null) {
          /**
           * Source PNG uses a deterministic Storage path (`source.png`). Overwriting via upload replaces bytes
           * without delete — **do not** delete-before-upload for the same path: delete removes the object while
           * Firestore still stores the previous download URL, so any fetch (reload, another tab) returns 403 until
           * upload finishes (token/generation mismatch window).
           */
          imageUrl = await this.adapter.uploadImage(projectId, currentImage);
          engineSourceTouch = 'uploaded';
        } else if (this._lastPersistedImageUrl !== null) {
          await this.adapter.deleteImage(this._lastPersistedImageUrl);
          imageUrl = null;
          engineSourceTouch = 'deleted';
        }
      }

      const baseDto = snapshotToDto(snapshot, imageUrl);
      const dto = this._pigmentsState
        ? { ...baseDto, pigmentSettings: this._pigmentsState.getSnapshot() }
        : baseDto;
      await this.adapter.save(projectId, dto);

      if (engineSourceTouch !== null && this._onEngineSourceImageTouch !== undefined) {
        try {
          await Promise.resolve(
            this._onEngineSourceImageTouch({ projectId, kind: engineSourceTouch }),
          );
        } catch (err) {
          console.error('[persistence] dashboard thumbnail sync failed', err);
        }
      }

      this._lastPersistedImageUrl = imageUrl;
      this._lastSavedImageCopy = cloneRawImage(currentImage);
      this._setStatus('saved');
    } catch (err) {
      console.error('[persistence] save error:', err);
      this._setStatus('error');
      throw err;
    }
  }
}
