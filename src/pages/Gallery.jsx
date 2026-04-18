import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '@/firebase/config';
import { subscribeCuratedSongs, subscribeSubmissions, subscribeVotes, castVote, removeVote } from '../firebase/firestore.js';
import SongCard from '../components/SongCard.jsx';
import CuratedSongRow from '../components/CuratedSongRow.jsx';
import DecadeFilter from '../components/DecadeFilter.jsx';
import { Button } from '@/components/ui/button';

export default function Gallery() {
  const [curated, setCurated] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [votes, setVotes] = useState([]);
  const [curatedDecade, setCuratedDecade] = useState(null);
  const [submissionsDecade, setSubmissionsDecade] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => auth.onAuthStateChanged(setUser), []);

  useEffect(() => {
    const unsub1 = subscribeCuratedSongs(setCurated, setError);
    const unsub2 = subscribeSubmissions(setSubmissions, setError);
    const unsub3 = subscribeVotes(setVotes, setError);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  // Map of `{songCollection}_{songId}` -> vote count
  const voteCounts = useMemo(() => {
    const map = new Map();
    for (const v of votes) {
      const key = `${v.songCollection}_${v.songId}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [votes]);

  // Set of song keys the current user has voted for
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

  const filteredCurated = curatedDecade
    ? curated.filter((s) => Math.floor(s.year / 10) * 10 === curatedDecade)
    : curated;

  const filteredSubmissions = submissionsDecade
    ? submissions.filter((s) => Math.floor(s.year / 10) * 10 === submissionsDecade)
    : submissions;

  if (error) {
    return (
      <p className="p-8 text-center text-destructive">
        Could not load songs. Please try again later.
      </p>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 pb-16">

      {/* ── Header ────────────────��─────────────────────────────── */}
      <header className="text-center py-12 mb-12 border-b border-border">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
          Dialling in the Years
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          A song for every year, chosen by the museum and by you.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg">
            <a href="#curated">Museum picks</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/submit">Submit a song</Link>
          </Button>
          {user && !user.isAnonymous && (
            <Button asChild size="lg" variant="outline">
              <Link to="/my-submissions">Your submissions</Link>
            </Button>
          )}
        </div>
      </header>

      {/* ── Curated songs ───────────────────────────────────────── */}
      <section id="curated" className="mb-16" aria-labelledby="curated-heading">
        <div className="mb-4">
          <h2 id="curated-heading" className="text-2xl font-bold mb-1">Museum picks</h2>
          <p className="text-muted-foreground text-sm">
            Songs chosen by the curator — one for every year from 1955.
          </p>
        </div>

        <DecadeFilter
          songs={curated}
          activDecade={curatedDecade}
          onSelect={setCuratedDecade}
        />

        {curated.length === 0 ? (
          <p className="text-muted-foreground py-8">No curated songs yet.</p>
        ) : filteredCurated.length === 0 ? (
          <p className="text-muted-foreground py-8">No songs for this decade.</p>
        ) : (
          <div className="border border-border rounded-lg px-3">
            {filteredCurated.map((song) => (
              <CuratedSongRow
                key={song.id}
                song={song}
                voteCount={voteCounts.get(`curated_songs_${song.id}`) || 0}
                userVoted={userVotes.has(`curated_songs_${song.id}`)}
                canVote={canVote}
                onVote={() => handleVote('curated_songs', song.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Visitor submissions ────────────────────��─────────────── */}
      <section aria-labelledby="submissions-heading">
        <div className="mb-4">
          <h2 id="submissions-heading" className="text-2xl font-bold mb-1">
            Visitor submissions
          </h2>
          <p className="text-muted-foreground text-sm">
            Songs submitted by visitors for years 2001 to today.
          </p>
        </div>

        <DecadeFilter
          songs={submissions}
          activDecade={submissionsDecade}
          onSelect={setSubmissionsDecade}
        />

        {submissions.length === 0 ? (
          <p className="text-muted-foreground py-8">
            No submissions yet.{' '}
            <Link to="/submit" className="text-primary underline">
              Be the first to add one.
            </Link>
          </p>
        ) : filteredSubmissions.length === 0 ? (
          <p className="text-muted-foreground py-8">No submissions for this decade.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSubmissions.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                showSubmitter
                voteCount={voteCounts.get(`submissions_${song.id}`) || 0}
                userVoted={userVotes.has(`submissions_${song.id}`)}
                canVote={canVote}
                onVote={() => handleVote('submissions', song.id)}
              />
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
