import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config.js';

/**
 * Subscribe to all visible curated songs, sorted most-recently-chosen first.
 * Returns an unsubscribe function.
 */
export function subscribeCuratedSongs(onChange, onError) {
  const q = query(
    collection(db, 'curated_songs'),
    where('visible', '==', true),
    orderBy('chosenAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}

/**
 * Subscribe to all visible submissions, sorted by year ascending.
 * Returns an unsubscribe function.
 */
export function subscribeSubmissions(onChange, onError) {
  const q = query(
    collection(db, 'submissions'),
    where('visible', '==', true),
    orderBy('year', 'asc')
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}

/**
 * Write a visitor submission and the associated user profile entry.
 * Email is stored only in user_profiles — never on the submission document.
 *
 * @param {{ year, title, artist, story, submitterName, email }} fields
 * @param {string} uid - Firebase Auth UID of the submitter
 * @param {boolean} isAnonymous
 */
export async function createSubmission({ year, title, artist, story, submitterName, email }, uid, isAnonymous) {
  // Write submission — no email field
  await addDoc(collection(db, 'submissions'), {
    year,
    title,
    artist,
    story,
    submitterName,
    uid,
    visible: true,
    createdAt: serverTimestamp(),
  });

  // Write or merge user profile — email stays here only
  await setDoc(
    doc(db, 'user_profiles', uid),
    { email, isAnonymous, createdAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Update user_profiles after account linking: mark as verified and record
 * the previous anonymous UID.
 */
export async function linkUserProfile(newUid, previousUid) {
  await setDoc(
    doc(db, 'user_profiles', newUid),
    {
      isAnonymous: false,
      linkedUids: previousUid ? [previousUid] : [],
    },
    { merge: true }
  );
}
