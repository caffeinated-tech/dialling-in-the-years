import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config.js';

/** All submissions (visible and hidden), newest first. Admin only. */
export function subscribeAllSubmissions(onChange, onError) {
  const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}

/** All curated songs (visible and hidden), newest chosen first. Admin only. */
export function subscribeAllCuratedSongs(onChange, onError) {
  const q = query(collection(db, 'curated_songs'), orderBy('chosenAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}

/** Fetch the email from a user_profiles document. Returns null if not found. */
export async function getUserEmail(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'user_profiles', uid));
  return snap.exists() ? (snap.data().email ?? null) : null;
}

export async function updateSubmission(id, updates) {
  await updateDoc(doc(db, 'submissions', id), updates);
}

export async function deleteSubmission(id) {
  await deleteDoc(doc(db, 'submissions', id));
}

export async function updateCuratedSong(id, updates) {
  await updateDoc(doc(db, 'curated_songs', id), updates);
}

export async function deleteCuratedSong(id) {
  await deleteDoc(doc(db, 'curated_songs', id));
}

export async function addCuratedSong({ year, title, artist, story }) {
  await addDoc(collection(db, 'curated_songs'), {
    year,
    title,
    artist,
    story,
    visible: true,
    chosenAt: serverTimestamp(),
  });
}
