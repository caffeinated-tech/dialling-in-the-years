import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '@/firebase/config';
import { subscribeCuratedSongs, subscribeSubmissions } from '../firebase/firestore.js';
import SongCard from '../components/SongCard.jsx';
import DecadeFilter from '../components/DecadeFilter.jsx';
import { Button } from '@/components/ui/button';

export default function Gallery() {
  const [curated, setCurated] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [curatedDecade, setCuratedDecade] = useState(null);
  const [submissionsDecade, setSubmissionsDecade] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => auth.onAuthStateChanged(setUser), []);

  useEffect(() => {
    const unsub1 = subscribeCuratedSongs(setCurated, setError);
    const unsub2 = subscribeSubmissions(setSubmissions, setError);
    return () => { unsub1(); unsub2(); };
  }, []);

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
      <section className="mb-16" aria-labelledby="curated-heading">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCurated.map((song) => (
              <SongCard key={song.id} song={song} />
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
              <SongCard key={song.id} song={song} showSubmitter />
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
