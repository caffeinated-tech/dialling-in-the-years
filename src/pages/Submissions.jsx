import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeSubmissions } from '@/firebase/firestore';
import SongCard from '@/components/SongCard';
import DecadeFilter from '@/components/DecadeFilter';
import { useVotes } from '@/hooks/useVotes';
import { Button } from '@/components/ui/button';

export default function Submissions() {
  const [songs, setSongs] = useState([]);
  const [decade, setDecade] = useState(null);
  const [error, setError] = useState(null);
  const { voteCounts, userVotes, canVote, handleVote } = useVotes();

  useEffect(() => subscribeSubmissions(setSongs, setError), []);

  const filtered = decade
    ? songs.filter((s) => Math.floor(s.year / 10) * 10 === decade)
    : songs;

  if (error) {
    return <p className="p-8 text-center text-destructive">Could not load songs. Please try again later.</p>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 pb-16 pt-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Visitor submissions</h1>
          <p className="text-muted-foreground text-sm">
            Songs submitted by visitors for years 2001 to today.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link to="/submit">Submit a song</Link>
        </Button>
      </div>

      <DecadeFilter songs={songs} activDecade={decade} onSelect={setDecade} />

      {songs.length === 0 ? (
        <p className="text-muted-foreground py-8">
          No submissions yet.{' '}
          <Link to="/submit" className="text-primary underline">
            Be the first to add one.
          </Link>
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-8">No submissions for this decade.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((song) => (
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
    </main>
  );
}
