import {
  signInAnonymously,
  browserSessionPersistence,
  setPersistence,
  linkWithCredential,
  linkWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  EmailAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from './config.js';

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
 * Link the current anonymous user to an email/password credential.
 * If the email is already in use by an existing account, falls back to
 * signing in with that credential instead.
 */
export async function linkWithEmail(email, password) {
  const credential = EmailAuthProvider.credential(email, password);
  try {
    const result = await linkWithCredential(auth.currentUser, credential);
    return { user: result.user, isNewAccount: true };
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const result = await signInWithCredential(auth, credential);
      return { user: result.user, isNewAccount: false };
    }
    throw err;
  }
}

/**
 * Link the current anonymous user to a Google account via popup.
 * If the Google account is already in use, falls back to signing in.
 */
export async function linkWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    return { user: result.user, isNewAccount: true };
  } catch (err) {
    if (err.code === 'auth/credential-already-in-use' || err.code === 'auth/email-already-in-use') {
      const credential = GoogleAuthProvider.credentialFromError(err);
      const result = await signInWithCredential(auth, credential);
      return { user: result.user, isNewAccount: false };
    }
    throw err;
  }
}

export async function signOutUser() {
  await signOut(auth);
}
