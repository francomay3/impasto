import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

const E2E_TEST_MODE = import.meta.env.VITE_E2E_TEST_MODE === 'true';
const TEST_USER = E2E_TEST_MODE ? ({ uid: 'test-uid', email: 'test@example.com' } as unknown as User) : null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(TEST_USER);
  const [loading, setLoading] = useState(!E2E_TEST_MODE);

  useEffect(() => {
    if (E2E_TEST_MODE) return;
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        await u.reload();
        setUser(auth.currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
