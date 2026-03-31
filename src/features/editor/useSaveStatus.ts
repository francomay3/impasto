import { useState, useRef, useCallback } from 'react';
import type { ProjectState } from '../../types';

export type SaveStatus = 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 300;

export function useSaveStatus(onSave: (state: ProjectState) => void | Promise<void>) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestRef = useRef<ProjectState | null>(null);
  const genRef = useRef(0);

  const save = useCallback(
    (state: ProjectState) => {
      latestRef.current = state;
      setStatus('saving');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const gen = ++genRef.current;
        try {
          await onSave(latestRef.current!);
          if (genRef.current === gen) setStatus('saved');
        } catch {
          if (genRef.current === gen) setStatus('error');
        }
      }, DEBOUNCE_MS);
    },
    [onSave]
  );

  return { status, save };
}
