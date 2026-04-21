import { Center, Loader } from '@mantine/core';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from './authStore';
import { AuthScreen } from './AuthScreen';
import { logEditorStartupPhase } from '../../utils/editorStartupTiming';

export function AuthGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    if (user) {
      logEditorStartupPhase('auth:AuthGuard confirmed user — rendering children');
    }
  }, [user]);

  if (loading) {
    return (
      <Center h="100vh" style={{ background: 'var(--mantine-color-dark-9)' }}>
        <Loader color="primary" />
      </Center>
    );
  }

  if (!user) return <AuthScreen />;

  return <>{children}</>;
}
