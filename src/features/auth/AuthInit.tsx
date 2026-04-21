import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuthStore } from './authStore';
import { saveUserProfile, checkIsAdmin } from '../../services/userService';
import { logEditorStartupPhase } from '../../utils/editorStartupTiming';

export function AuthInit() {
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      logEditorStartupPhase('auth:onAuthStateChanged fired', { hasUser: !!u });

      if (u) {
        // Phase 1: unblock routing immediately — user identity is confirmed.
        // isAdmin defaults to false; the admin guard will re-check once phase 2 settles.
        useAuthStore.setState({ user: u, loading: false, isAdmin: false });
        logEditorStartupPhase('auth:store updated (phase 1 — user set, isAdmin pending)');

        // Phase 2: background — all three run in parallel (uid is stable, no sequential dependency).
        logEditorStartupPhase('auth:async ops start (reload + checkIsAdmin + saveProfile — parallel)');
        const [isAdmin] = await Promise.all([
          checkIsAdmin(u.uid),
          saveUserProfile(u.uid, u.email, u.displayName),
          u.reload(),
        ]);
        logEditorStartupPhase('auth:async ops settled', { isAdmin });
        // auth.currentUser reflects the reloaded user (refreshed token / profile).
        useAuthStore.setState({ user: auth.currentUser ?? u, isAdmin });
        logEditorStartupPhase('auth:store updated (phase 2 — isAdmin resolved)');
      } else {
        useAuthStore.setState({ user: null, loading: false, isAdmin: false });
        logEditorStartupPhase('auth:store updated (signed out)');
      }
    });
  }, []);
  return null;
}
