 
import { createContext, useContext } from 'react';
import { ImpastoEngine } from './ImpastoEngine';

export const ImpastoEngineContext = createContext<ImpastoEngine | null>(null);

export function useImpastoEngine(): ImpastoEngine {
  const engine = useContext(ImpastoEngineContext);
  if (!engine) {
    throw new Error('useImpastoEngine must be used within ImpastoEngineProvider');
  }
  return engine;
}
