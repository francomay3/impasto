import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface AuthStore {
  user: User | null;
  loading: boolean;
}

const E2E_TEST_MODE = import.meta.env.VITE_E2E_TEST_MODE === 'true';
const E2E_SIGNED_OUT = E2E_TEST_MODE && typeof window !== 'undefined' && (window as Window & { __e2e_signed_out?: boolean }).__e2e_signed_out === true;

const TEST_USER = E2E_TEST_MODE && !E2E_SIGNED_OUT
  ? ({ uid: 'test-uid', email: 'test@example.com' } as unknown as User)
  : null;

export const useAuthStore = create<AuthStore>(() => ({
  user: TEST_USER,
  loading: E2E_SIGNED_OUT ? false : !E2E_TEST_MODE,
}));
