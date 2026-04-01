import { createContext, useContext } from 'react'
import type { CanvasEngine } from './CanvasEngine'

const EngineContext = createContext<CanvasEngine | null>(null)

export const EngineProvider = EngineContext.Provider

export function useEngine(): CanvasEngine {
  const engine = useContext(EngineContext)
  if (!engine) throw new Error('useEngine must be used within EngineProvider')
  return engine
}
