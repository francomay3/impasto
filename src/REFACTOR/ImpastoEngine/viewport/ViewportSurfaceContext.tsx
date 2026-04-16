/* eslint-disable react-refresh/only-export-components -- context + hook intentionally colocated */
import { createContext, useContext, type ReactNode } from 'react';
import type { ViewportSurfaceId } from '../viewports/canvas/host/viewportInputPolicy';

const ViewportSurfaceContext = createContext<ViewportSurfaceId | null>(null);

export function ViewportSurfaceProvider({
  value,
  children,
}: {
  value: ViewportSurfaceId;
  children: ReactNode;
}) {
  return <ViewportSurfaceContext.Provider value={value}>{children}</ViewportSurfaceContext.Provider>;
}

export function useViewportSurface(): ViewportSurfaceId {
  const surface = useContext(ViewportSurfaceContext);
  if (!surface) {
    throw new Error('useViewportSurface must be used within ViewportSurfaceProvider');
  }
  return surface;
}
