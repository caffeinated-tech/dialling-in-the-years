import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeCuratedSongs, subscribeSubmissions } from '../firebase/firestore.js';
import SongCard from '../components/SongCard.jsx';
import DecadeFilter from '../components/DecadeFilter.jsx';

export default function Gallery() {
  const [curated, setCurated] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [curatedDecade, setCuratedDecade] = useState(null);
  const [submissionsDecade, setSubmissionsDecade] = useState(null);
  const [error, setError] = useState(null);

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
    return <p className="error">Could not load songs. Please try again later.</p>;
  }

  return (
    <main className="gallery">
      <header className="gallery__header">
        <h1>Dialling in the Years</h1>
        <p className="gallery__subtitle">
          A song for every year, chosen by the museum and by you.
        </p>
        <Link to="/submit" className="btn btn--primary">Submit a song</Link>
      </header>

      {/* ── Curated songs ─────────────────────────────────────────── */}
      <section className="gallery__section" aria-labelledby="curated-heading">
        <div className="gallery__section-header">
          <h2 id="curated-heading">Museum picks</h2>
          <p className="gallery__section-desc">
            Songs chosen by the curator — one for every year from 1955.
          </p>
        </div>

        <DecadeFilter
          songs={curated}
          activDecade={curatedDecade}
          onSelect={setCuratedDecade}
        />

        {curated.length === 0 ? (
          <p className="gallery__empty">No curated songs yet.</p>
        ) : filteredCurated.length === 0 ? (
          <p className="gallery__empty">No songs for this decade.</p>
        ) : (
          <div className="song-grid">
            {filteredCurated.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </section>

      {/* ── Visitor submissions ───────────────────────────────────── */}
      <section className="gallery__section" aria-labelledby="submissions-heading">
        <div className="gallery__section-header">
          <h2 id="submissions-heading">Visitor submissions</h2>
          <p className="gallery__section-desc">
            Songs submitted by visitors for years 2001 to today.
          </p>
        </div>

        <DecadeFilter
          songs={submissions}
          activDecade={submissionsDecade}
          onSelect={setSubmissionsDecade}
        />

        {submissions.length === 0 ? (
          <p className="gallery__empty">
            No submissions yet.{' '}
            <Link to="/submit">Be the first to add one.</Link>
          </p>
        ) : filteredSubmissions.length === 0 ? (
          <p className="gallery__empty">No submissions for this decade.</p>
        ) : (
          <div className="song-grid">
            {filteredSubmissions.map((song) => (
              <SongCard key={song.id} song={song} showSubmitter />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
