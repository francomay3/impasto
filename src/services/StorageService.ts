import type { ProjectState } from '../types';
import { DEFAULT_PROJECT_STATE } from '../types';

export interface IStorageService {
  save(state: ProjectState): void;
  load(): ProjectState | null;
  exportJSON(): string;
}

const STORAGE_KEY = 'artist-toolbox-project';

export class JSONLocalStorage implements IStorageService {
  save(state: ProjectState): void {
    // Never persist imageDataUrl — images are too large for localStorage (5MB limit)
    const slim = { ...state, imageDataUrl: null };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch (err) {
      console.error('Could not save project state.', err);
    }
  }

  load(): ProjectState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as ProjectState;
    } catch {
      return null;
    }
  }

  exportJSON(): string {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ?? JSON.stringify(DEFAULT_PROJECT_STATE);
  }
}

export const storageService: IStorageService = new JSONLocalStorage();
