import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { DashboardPage } from '../pages/DashboardPage';
import { ProjectPage } from '../pages/ProjectPage';
import { ContextMenuProvider } from '../context/ContextMenuContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function AppRouter() {
  return (
    <BrowserRouter>
      <ContextMenuProvider>
        <Routes>
          <Route
            path="*"
            element={
              <AuthGuard>
                <Routes>
                  <Route path="/" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
                  <Route path="/project/:id" element={<ErrorBoundary><ProjectPage /></ErrorBoundary>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AuthGuard>
            }
          />
        </Routes>
      </ContextMenuProvider>
    </BrowserRouter>
  );
}
