import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
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
 * Subscribe to all visible submissions. Sorting and filtering are handled
 * client-side so that vote-based sorting can work without a Firestore index.
 * Returns an unsubscribe function.
 */
export function subscribeSubmissions(onChange, onError) {
  const q = query(
    collection(db, 'submissions'),
    where('visible', '==', true),
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
  const now = serverTimestamp();
  await addDoc(collection(db, 'submissions'), {
    year,
    title,
    artist,
    story,
    submitterName,
    uid,
    visible: true,
    createdAt: now,
    updatedAt: now,
  });

  // Only write to user_profiles when an email was provided
  if (email) {
    await setDoc(
      doc(db, 'user_profiles', uid),
      { email, isAnonymous, createdAt: serverTimestamp() },
      { merge: true }
    );
  }
}

/**
 * Subscribe to all submissions belonging to the given UID, sorted by year.
 * Uses the owner read rule — works even for hidden submissions.
 */
export function subscribeUserSubmissions(uid, onChange, onError) {
  const q = query(
    collection(db, 'submissions'),
    where('uid', '==', uid),
    orderBy('year', 'asc')
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}

/**
 * Update editable fields on the user's own submission.
 * Immutable fields (uid, visible, promoted, createdAt) are not touched here.
 */
export async function updateOwnSubmission(id, { year, title, artist, story, submitterName }) {
  await updateDoc(doc(db, 'submissions', id), { year, title, artist, story, submitterName, updatedAt: serverTimestamp() });
}

/**
 * Update submitterName on all submissions and curated songs belonging to uid.
 * Called when the user changes their display name on the profile page.
 *
 * Curated songs promoted before the `uid` field was introduced won't appear in
 * the uid-based query, so we also do a year-based lookup for any promoted
 * submissions and backfill `uid` on those legacy documents at the same time.
 */
export async function updateSubmitterName(uid, submitterName) {
  // 1. All submissions for this user
  const subSnap = await getDocs(query(collection(db, 'submissions'), where('uid', '==', uid)));

  // 2. Curated songs that already have this user's uid
  const curatedByUid = await getDocs(query(collection(db, 'curated_songs'), where('uid', '==', uid)));
  const curatedIds = new Set(curatedByUid.docs.map((d) => d.id));

  // 3. Curated songs for promoted submissions that predate the uid field
  const promotedYears = subSnap.docs
    .filter((d) => d.data().promoted === true)
    .map((d) => String(d.data().year))
    .filter((year) => !curatedIds.has(year));

  const legacyDocs = (
    await Promise.all(promotedYears.map((year) => getDoc(doc(db, 'curated_songs', year))))
  ).filter((d) => d.exists());

  await Promise.all([
    // Submissions need updatedAt to satisfy the owner-update rule
    ...subSnap.docs.map((d) => updateDoc(d.ref, { submitterName, updatedAt: serverTimestamp() })),
    // Curated songs with uid already stored
    ...curatedByUid.docs.map((d) => updateDoc(d.ref, { submitterName })),
    // Legacy curated songs — backfill uid at the same time
    ...legacyDocs.map((d) => updateDoc(d.ref, { submitterName, uid })),
  ]);
}

// ─── Votes ────────────────────────────────────────────────────────────────────

/**
 * Subscribe to all votes in real-time.
 * Callers derive per-song counts and per-user state from the resulting array.
 */
export function subscribeVotes(onChange, onError) {
  return onSnapshot(collection(db, 'votes'), (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}

/**
 * Cast a vote for a song. The document ID encodes the voter's UID so the
 * same user cannot vote twice for the same song.
 *
 * @param {string} uid
 * @param {'curated_songs'|'submissions'} songCollection
 * @param {string} songId
 */
export async function castVote(uid, songCollection, songId) {
  const voteId = `${songCollection}_${songId}_${uid}`;
  await setDoc(doc(db, 'votes', voteId), {
    uid,
    songCollection,
    songId,
    createdAt: serverTimestamp(),
  });
}

/**
 * Remove a previously cast vote.
 */
export async function removeVote(uid, songCollection, songId) {
  const voteId = `${songCollection}_${songId}_${uid}`;
  await deleteDoc(doc(db, 'votes', voteId));
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
