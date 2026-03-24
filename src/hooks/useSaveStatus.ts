import { useState, useRef, useCallback } from 'react';
import type { ProjectState } from '../types';

export type SaveStatus = 'saving' | 'saved';

const DEBOUNCE_MS = 300;

export function useSaveStatus(onSave: (state: ProjectState) => void | Promise<void>) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const latestRef = useRef<ProjectState | null>(null);
  const genRef = useRef(0);

  const save = useCallback((state: ProjectState) => {
    latestRef.current = state;
    setStatus('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const gen = ++genRef.current;
      try {
        await onSave(latestRef.current!);
      } finally {
        if (genRef.current === gen) setStatus('saved');
      }
    }, DEBOUNCE_MS);
  }, [onSave]);

  return { status, save };
}
