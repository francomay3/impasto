import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuthStore } from './authStore';
import { saveUserProfile, checkIsAdmin } from '../../services/userService';

const E2E_TEST_MODE = import.meta.env.VITE_E2E_TEST_MODE === 'true';

export function AuthInit() {
  useEffect(() => {
    if (E2E_TEST_MODE) return;
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        await u.reload();
        const currentUser = auth.currentUser!;
        const [isAdmin] = await Promise.all([
          checkIsAdmin(currentUser.uid),
          saveUserProfile(currentUser.uid, currentUser.email, currentUser.displayName),
        ]);
        useAuthStore.setState({ user: currentUser, loading: false, isAdmin });
      } else {
        useAuthStore.setState({ user: null, loading: false, isAdmin: false });
      }
    });
  }, []);
  return null;
}
