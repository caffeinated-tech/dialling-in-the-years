import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';

/**
 * Returns { user, isAdmin, loading }.
 * isAdmin is derived from the Firebase Auth custom claim `admin: true`.
 * Forces a token refresh on each auth state change to pick up newly granted claims.
 */
export function useAuth() {
  const [state, setState] = useState({ user: null, isAdmin: false, loading: true });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, isAdmin: false, loading: false });
        return;
      }
      // forceRefresh: true ensures we pick up any custom claim changes
      const tokenResult = await user.getIdTokenResult(true);
      setState({ user, isAdmin: tokenResult.claims.admin === true, loading: false });
    });
  }, []);

  return state;
}
