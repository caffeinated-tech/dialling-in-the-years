import { useEffect, useRef, useCallback } from 'react';
import { signOutUser } from '@/firebase/auth';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

/**
 * Automatically signs out the current anonymous user after IDLE_TIMEOUT_MS of
 * inactivity. Non-anonymous users are not affected.
 *
 * Call resetSession() to manually trigger an immediate sign-out and reload —
 * this is wired to the visible "Done" button on the submission form.
 */
export function useKioskReset(isAnonymous, onReset) {
  const timerRef = useRef(null);

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (isAnonymous) {
        await signOutUser();
        onReset?.();
      }
    }, IDLE_TIMEOUT_MS);
  }, [isAnonymous, onReset]);

  useEffect(() => {
    if (!isAnonymous) return;
    reset();
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [isAnonymous, reset]);

  const resetSession = useCallback(async () => {
    clearTimeout(timerRef.current);
    await signOutUser();
    onReset?.();
  }, [onReset]);

  return { resetSession };
}
