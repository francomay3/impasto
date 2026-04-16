import type { RawImage } from '../../types';
import type { ImpastoEngine } from '../ImpastoEngine/core/ImpastoEngine';
import type { IStorageAdapter } from './IStorageAdapter';
import { dtoToSnapshot, snapshotToDto } from './impastoProjectMapper';
import { cloneRawImage, rawImageContentEquals } from './rawImageCompare';
import { loadRawImageFromUrl } from './loadRawImageFromUrl';

const DEFAULT_DOCUMENT_DEBOUNCE_MS = 1_500;

/** Autosave lifecycle for UI or logging; see {@link PersistenceGlue.subscribeStatus}. */
export type PersistenceStatus = 'idle' | 'saving' | 'saved' | 'error';

type PersistenceGlueOptions = {
  /**
   * Milliseconds to wait after the last document-changed signal before the debounced save path runs.
   * @default 1500
   */
  debounceMs?: number;
};

/**
 * Wires {@link ImpastoEngine} document snapshots to an {@link IStorageAdapter} (debounced autosave, hydration).
 */
export class PersistenceGlue {
  private readonly engine: ImpastoEngine;
  private readonly adapter: IStorageAdapter;
  private readonly debounceMs: number;

  /** Set by {@link PersistenceGlue.initialize} once a project is known. */
  private _projectId: string | null = null;
  /**
   * True when a debounced flush arrived while the coalescing save chain was already running.
   * The chain re-runs once after the current save completes.
   */
  private _pendingDirty = false;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** Populated when document subscription is wired; cleared in {@link PersistenceGlue.dispose}. */
  private _unsubscribeDocument: (() => void) | null = null;
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
    this.debounceMs = options?.debounceMs ?? DEFAULT_DOCUMENT_DEBOUNCE_MS;

    this._unsubscribeDocument = engine.subscribeDocumentChanged(() => {
      this._onDocumentChanged();
    });
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

  /**
   * Loads persisted document state when a record exists, then stores `projectId` for debounced saves.
   * Fetches and decodes the stored image (if any) and passes it to `engine.loadDocument` so the image
   * is hydrated in the same call. URL and pixel bookkeeping are synced so the first save after hydration
   * does not spuriously delete or re-upload when the in-memory image already matches what was persisted.
   */
  async initialize(projectId: string): Promise<void> {
    const dto = await this.adapter.load(projectId);
    this._projectId = projectId;

    if (dto !== null) {
      let sourceImage: RawImage | null = null;
      if (dto.imageUrl !== null) {
        sourceImage = await loadRawImageFromUrl(dto.imageUrl);
      }
      this.engine.loadDocument(dtoToSnapshot(dto), sourceImage);
      this._lastPersistedImageUrl = dto.imageUrl;
      this._lastSavedImageCopy = cloneRawImage(this.engine.image.get());
    } else {
      this._lastPersistedImageUrl = null;
      this._lastSavedImageCopy = null;
    }
  }

  dispose(): void {
    this._clearDebounceTimer();
    this._unsubscribeDocument?.();
    this._unsubscribeDocument = null;
    this._statusListeners.clear();
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
      const imageChanged = !rawImageContentEquals(currentImage, this._lastSavedImageCopy);

      let imageUrl = this._lastPersistedImageUrl;
      if (imageChanged) {
        if (this._lastPersistedImageUrl !== null) {
          await this.adapter.deleteImage(this._lastPersistedImageUrl);
        }
        if (currentImage !== null) {
          imageUrl = await this.adapter.uploadImage(projectId, currentImage);
        } else {
          imageUrl = null;
        }
      }

      await this.adapter.save(projectId, snapshotToDto(snapshot, imageUrl));

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
