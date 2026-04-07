import { Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuthStore } from '../auth/authStore';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { loading, isAdmin } = useAuthStore();

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
