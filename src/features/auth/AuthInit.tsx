import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuthStore } from './authStore';

const E2E_TEST_MODE = import.meta.env.VITE_E2E_TEST_MODE === 'true';

export function AuthInit() {
  useEffect(() => {
    if (E2E_TEST_MODE) return;
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        await u.reload();
        useAuthStore.setState({ user: auth.currentUser, loading: false });
      } else {
        useAuthStore.setState({ user: null, loading: false });
      }
    });
  }, []);
  return null;
}
