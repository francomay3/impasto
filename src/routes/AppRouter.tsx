import { Center, Loader } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '../features/auth/AuthGuard';
import { AdminGuard } from '../features/admin/AdminGuard';
import { AdminPage } from '../features/admin/AdminPage';
import { DevPage } from '../features/dev/DevPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ProjectPage } from '../features/editor/ProjectPage';
import { ContextMenuPortal } from '../shared/ContextMenuPortal';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { logEditorStartupPhase } from '../utils/editorStartupTiming';

// When the user reloads on a project route, start fetching the chunk immediately —
// in parallel with auth — rather than waiting for auth to resolve first.
type ProjectV2Module = typeof import('../features/projectv2/ProjectPageV2');
let projectV2Preload: Promise<ProjectV2Module> | null = null;
if (window.location.pathname.startsWith('/projectv2/')) {
  logEditorStartupPhase('route:lazy ProjectPageV2 chunk preload triggered');
  projectV2Preload = import('../features/projectv2/ProjectPageV2').then((m) => {
    logEditorStartupPhase('route:lazy ProjectPageV2 chunk preload settled');
    return m;
  });
}

const LazyProjectPageV2 = lazy(() => {
  if (projectV2Preload) {
    return projectV2Preload.then((m) => ({ default: m.ProjectPageV2 }));
  }
  logEditorStartupPhase('route:lazy ProjectPageV2 chunk fetch start');
  return import('../features/projectv2/ProjectPageV2').then((m) => {
    logEditorStartupPhase('route:lazy ProjectPageV2 chunk fetch settled');
    return { default: m.ProjectPageV2 };
  });
});

export function AppRouter() {
  return (
    <BrowserRouter>
      <ContextMenuPortal />
      <Routes>
        <Route
          path="/dev"
          element={
            <ErrorBoundary>
              <DevPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/dev/:id"
          element={
            <ErrorBoundary>
              <DevPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="*"
          element={
            <AuthGuard>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ErrorBoundary>
                      <DashboardPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/project/:id"
                  element={
                    <ErrorBoundary>
                      <ProjectPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/projectv2/:id"
                  element={
                    <ErrorBoundary>
                      <Suspense
                        fallback={
                          <Center h="100vh" style={{ background: 'var(--mantine-color-dark-9)' }}>
                            <Loader color="primary" />
                          </Center>
                        }
                      >
                        <LazyProjectPageV2 />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminGuard>
                      <AdminPage />
                    </AdminGuard>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
