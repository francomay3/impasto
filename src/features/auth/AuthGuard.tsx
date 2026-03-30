import { Center, Loader } from '@mantine/core';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { AuthScreen } from './AuthScreen';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

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
