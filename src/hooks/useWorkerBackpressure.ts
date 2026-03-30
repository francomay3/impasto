import { useCallback, useEffect, useRef } from 'react';

type Options<TOutput> = {
  createWorker: () => Worker;
  onMessage: (data: TOutput) => void;
  errorLabel?: string;
};

/**
 * Manages a Web Worker with a busy/pending backpressure queue:
 * - Only one message in-flight at a time.
 * - If a new schedule() arrives while busy, it is queued and fired on completion.
 * - The caller sets fireRef.current each render to the function that builds and posts the message.
 */
export function useWorkerBackpressure<TOutput>({
  createWorker,
  onMessage,
  errorLabel = 'worker',
}: Options<TOutput>) {
  const workerRef = useRef<Worker | null>(null);
  const busyRef = useRef(false);
  const pendingRef = useRef(false);
  const fireRef = useRef<() => void>(() => {});
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const schedule = useCallback(() => {
    pendingRef.current = true;
    if (busyRef.current) return;
    pendingRef.current = false;
    fireRef.current();
  }, []);

  useEffect(() => {
    const worker = createWorker();
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<TOutput>) => {
      onMessageRef.current(e.data);
      busyRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        fireRef.current();
      }
    };
    worker.onerror = (e) => console.error(`[${errorLabel}]`, e);
    return () => {
      worker.terminate();
      busyRef.current = false;
    };
    // createWorker must be a stable reference — captured once at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { workerRef, busyRef, fireRef, schedule };
}
