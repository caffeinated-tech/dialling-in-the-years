import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
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
