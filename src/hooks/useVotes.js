import { useState, useEffect, useMemo } from 'react';
import { auth } from '@/firebase/config';
import { subscribeVotes, castVote, removeVote } from '@/firebase/firestore';

export function useVotes() {
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => auth.onAuthStateChanged(setUser), []);
  useEffect(() => subscribeVotes(setVotes, console.error), []);

  const voteCounts = useMemo(() => {
    const map = new Map();
    for (const v of votes) {
      const key = `${v.songCollection}_${v.songId}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [votes]);

  const userVotes = useMemo(() => {
    if (!user || user.isAnonymous) return new Set();
    return new Set(
      votes.filter((v) => v.uid === user.uid).map((v) => `${v.songCollection}_${v.songId}`)
    );
  }, [votes, user]);

  const canVote = !!user && !user.isAnonymous;

  async function handleVote(songCollection, songId) {
    if (!canVote) return;
    const key = `${songCollection}_${songId}`;
    if (userVotes.has(key)) {
      await removeVote(user.uid, songCollection, songId);
    } else {
      await castVote(user.uid, songCollection, songId);
    }
  }

  return { voteCounts, userVotes, canVote, handleVote };
}
