import {
  signInAnonymously,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  linkWithCredential,
  signInWithCredential,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  EmailAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from './config.js';

// localStorage keys used across the email-link flow
export const EMAIL_LINK_STORAGE_KEY = 'emailLinkSignIn_email';
export const EMAIL_LINK_ANON_UID_KEY = 'emailLinkSignIn_anonymousUid';

/**
 * Sign in anonymously using SESSION persistence so the session clears when
 * the browser tab is closed — important for shared museum kiosk devices.
 * Returns the UserCredential, or the existing user if already signed in.
 */
export async function signInAnonymouslyForKiosk() {
  await setPersistence(auth, browserSessionPersistence);
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/**
 * Send a sign-in link to the given email address.
 * Saves the email and the current anonymous UID to localStorage so
 * completeEmailLinkSignIn can retrieve them when the user returns.
 *
 * The redirect URL must be whitelisted in Firebase console:
 *   Authentication → Settings → Authorized domains
 */
export async function sendEmailLink(email, anonymousUid) {
  const actionCodeSettings = {
    url: window.location.origin,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
  if (anonymousUid) localStorage.setItem(EMAIL_LINK_ANON_UID_KEY, anonymousUid);
}

/**
 * Complete the email-link sign-in / account linking when the user returns
 * after clicking the link in their email.
 *
 * - If an anonymous session is still active: links that session to the
 *   verified email-link credential (merging prior submissions).
 * - If the session is gone (tab closed, different device): signs in directly.
 *
 * Returns { user, previousAnonymousUid } so the caller can update user_profiles.
 * Clears localStorage keys on completion.
 */
export async function completeEmailLinkSignIn(url) {
  if (!isSignInWithEmailLink(auth, url)) return null;

  const email = localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
  const previousAnonymousUid = localStorage.getItem(EMAIL_LINK_ANON_UID_KEY) ?? null;

  if (!email) {
    // Edge case: different device — prompt is handled by the caller
    return { needsEmail: true, previousAnonymousUid };
  }

  // Switch from per-tab session persistence to localStorage so the signed-in
  // state is shared across tabs (anonymous kiosk sessions stay tab-scoped).
  await setPersistence(auth, browserLocalPersistence);

  const credential = EmailAuthProvider.credentialWithLink(email, url);
  let user;

  if (auth.currentUser?.isAnonymous) {
    // Link the anonymous session to the verified account
    try {
      const result = await linkWithCredential(auth.currentUser, credential);
      user = result.user;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        // Email already has an account — sign in to that account instead
        const result = await signInWithCredential(auth, credential);
        user = result.user;
      } else {
        throw err;
      }
    }
  } else {
    const result = await signInWithEmailLink(auth, email, url);
    user = result.user;
  }

  localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
  localStorage.removeItem(EMAIL_LINK_ANON_UID_KEY);

  return { user, previousAnonymousUid, needsEmail: false };
}


export async function signOutUser() {
  await signOut(auth);
}
