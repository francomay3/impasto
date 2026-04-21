import type { PigmentSettings } from './impastoProjectDto';

export type { PigmentSettings };

/**
 * Project-level observable state for the pigment palette and mix settings.
 * Lives outside ImpastoEngine — the engine is not aware of it until explicitly wired.
 */
export class ProjectPigmentsState {
  private readonly _defaults: PigmentSettings;
  private _settings: PigmentSettings;
  private readonly _listeners = new Set<() => void>();

  constructor(defaults: PigmentSettings) {
    this._defaults = frozenSettings(defaults);
    this._settings = this._defaults;
  }

  /**
   * Returns the current settings. The object is frozen — external code must not mutate it.
   * The same reference is returned between mutations so useSyncExternalStore sees no change.
   */
  getSnapshot(): PigmentSettings {
    return this._settings;
  }

  /** Replace all settings (called by PersistenceGlue after hydration). */
  loadSettings(settings: PigmentSettings): void {
    this._settings = frozenSettings(settings);
    this._notify();
  }

  /** Restore to constructor defaults (called before a new project loads). */
  reset(): void {
    this._settings = this._defaults;
    this._notify();
  }

  togglePigment(name: string, enabled: boolean): void {
    const isEnabled = this._settings.enabledNames.includes(name);
    if (enabled === isEnabled) return;
    const next = enabled
      ? [...this._settings.enabledNames, name]
      : this._settings.enabledNames.filter((n) => n !== name);
    this._settings = frozenSettings({ ...this._settings, enabledNames: next });
    this._notify();
  }

  setMinPaintPercent(value: number): void {
    this._settings = frozenSettings({ ...this._settings, minPaintPercent: value });
    this._notify();
  }

  setDeltaThreshold(value: number): void {
    this._settings = frozenSettings({ ...this._settings, deltaThreshold: value });
    this._notify();
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notify(): void {
    for (const l of this._listeners) l();
  }
}

function frozenSettings(s: PigmentSettings): PigmentSettings {
  return Object.freeze({
    ...s,
    enabledNames: Object.freeze([...s.enabledNames]) as string[],
  }) as PigmentSettings;
}
