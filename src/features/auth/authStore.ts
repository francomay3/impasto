import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface AuthStore {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

// loading starts true so AuthGuard shows a spinner while Firebase resolves onAuthStateChanged.
// AuthInit always calls setState with loading: false once the listener fires (signed in or out).
export const useAuthStore = create<AuthStore>(() => ({
  user: null,
  loading: true,
  isAdmin: false,
}));
