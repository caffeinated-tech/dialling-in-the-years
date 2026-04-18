import { useState, useEffect } from 'react';
import { subscribeCuratedSongs } from '@/firebase/firestore';
import CuratedSongRow from '@/components/CuratedSongRow';
import DecadeFilter from '@/components/DecadeFilter';
import { useVotes } from '@/hooks/useVotes';

export default function MuseumPicks() {
  const [songs, setSongs] = useState([]);
  const [decade, setDecade] = useState(null);
  const [error, setError] = useState(null);
  const { voteCounts, userVotes, canVote, handleVote } = useVotes();

  useEffect(() => subscribeCuratedSongs(setSongs, setError), []);

  const filtered = decade
    ? songs.filter((s) => Math.floor(s.year / 10) * 10 === decade)
    : songs;

  if (error) {
    return <p className="p-8 text-center text-destructive">Could not load songs. Please try again later.</p>;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pb-16 pt-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Museum picks</h1>
        <p className="text-muted-foreground text-sm">
          Songs chosen by the curator — one for every year from 1955.
        </p>
      </div>

      <DecadeFilter songs={songs} activDecade={decade} onSelect={setDecade} />

      {songs.length === 0 ? (
        <p className="text-muted-foreground py-8">No curated songs yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-8">No songs for this decade.</p>
      ) : (
        <div className="border border-border rounded-lg px-3">
          {filtered.map((song) => (
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
    </main>
  );
}
