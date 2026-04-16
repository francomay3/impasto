/* eslint-disable react-refresh/only-export-components -- context + hook intentionally colocated with provider */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { RawImage } from '../../../types';
import { ImpastoEngine } from './ImpastoEngine';

const ImpastoEngineContext = createContext<ImpastoEngine | null>(null);

type ImpastoEngineProviderProps = {
  children: ReactNode;
  /** When set (including `null`), applied with {@link ImpastoEngine} `image.set` after the engine is constructed. */
  initialSourceImage?: RawImage | null;
};

/**
 * Owns one {@link ImpastoEngine} per active layout-effect pass.
 *
 * **React Strict Mode (dev)** runs `useLayoutEffect` setup → cleanup → setup on mount without resetting other hooks.
 * If the engine were created in `useState` / `useMemo` and only `dispose()` ran in cleanup, the same disposed instance
 * would remain in React state and pan/zoom would break. Creating the engine **inside** the effect and calling
 * `setEngine` ties the live instance to the effect pass so the second setup gets a fresh engine.
 */
export function ImpastoEngineProvider({
  children,
  initialSourceImage,
}: ImpastoEngineProviderProps) {
  const [engine, setEngine] = useState<ImpastoEngine | null>(null);
  /** First-render seed only: avoids recreating the engine when the parent passes a new `initialSourceImage` reference. */
  const initialSourceImageRef = useRef(initialSourceImage);

  useLayoutEffect(() => {
    const e = new ImpastoEngine();
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

  if (!engine) {
    return null;
  }

  return (
    <ImpastoEngineContext.Provider value={engine}>{children}</ImpastoEngineContext.Provider>
  );
}

export function useImpastoEngine(): ImpastoEngine {
  const engine = useContext(ImpastoEngineContext);
  if (!engine) {
    throw new Error('useImpastoEngine must be used within ImpastoEngineProvider');
  }
  return engine;
}
