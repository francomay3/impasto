import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '../features/auth/AuthGuard';
import { AdminGuard } from '../features/admin/AdminGuard';
import { AdminPage } from '../features/admin/AdminPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ProjectPage } from '../features/editor/ProjectPage';
import { ContextMenuPortal } from '../shared/ContextMenuPortal';
import { ErrorBoundary } from '../shared/ErrorBoundary';

export function AppRouter() {
  return (
    <BrowserRouter>
      <ContextMenuPortal />
      <Routes>
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
