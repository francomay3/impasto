import { createContext, useContext } from 'react';
import type { ToolId } from '../tools';

interface ToolContextValue {
  activeTool: ToolId | null;
  setActiveTool: (id: ToolId | null) => void;
}

const ToolContext = createContext<ToolContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToolContext(): ToolContextValue {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error('useToolContext must be used within ToolContext.Provider');
  return ctx;
}

export { ToolContext };
