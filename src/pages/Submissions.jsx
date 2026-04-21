import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';
import { subscribeSubmissions } from '@/firebase/firestore';
import CuratedSongRow from '@/components/CuratedSongRow';
import { useVotes } from '@/hooks/useVotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const YEARS = Array.from(
  { length: new Date().getFullYear() - 1955 + 1 },
  (_, i) => new Date().getFullYear() - i
);

// sort keys: field_direction
const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest first' },
  { value: 'createdAt_asc',  label: 'Oldest first' },
  { value: 'votes_desc',     label: 'Most votes' },
  { value: 'votes_asc',      label: 'Fewest votes' },
];

export default function Submissions() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yearFilter, setYearFilter] = useState('');
  const [submitterFilter, setSubmitterFilter] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const { voteCounts, userVotes, canVote, handleVote } = useVotes();

  useEffect(() => subscribeSubmissions((data) => { setSongs(data); setLoading(false); }, (err) => { setError(err); setLoading(false); }), []);

  const filtered = useMemo(() => {
    let result = songs;

    if (yearFilter) {
      result = result.filter((s) => s.year === Number(yearFilter));
    }

    if (submitterFilter.trim()) {
      const q = submitterFilter.trim().toLowerCase();
      result = result.filter((s) => s.submitterName?.toLowerCase().includes(q));
    }

    const [field, dir] = sort.split('_');
    result = [...result].sort((a, b) => {
      if (field === 'createdAt') {
        const at = (s) => s.createdAt?.seconds ?? 0;
        return dir === 'desc' ? at(b) - at(a) : at(a) - at(b);
      }
      if (field === 'votes') {
        const vc = (s) => voteCounts.get(`submissions_${s.id}`) ?? 0;
        return dir === 'desc' ? vc(b) - vc(a) : vc(a) - vc(b);
      }
      return 0;
    });

    return result;
  }, [songs, yearFilter, submitterFilter, sort, voteCounts]);

  if (error) {
    return <p className="p-8 text-center text-destructive">Could not load songs. Please try again later.</p>;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pb-16 pt-10">
      <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Visitor submissions</h1>
          <p className="text-muted-foreground text-sm">
            Songs submitted by visitors for years 1955 to today.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0 self-start">
          <Link to="/submit">Submit a song</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All years</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by submitter…"
          value={submitterFilter}
          onChange={(e) => setSubmitterFilter(e.target.value)}
          className="w-52"
        />

        <Select value={SORT_OPTIONS.find((o) => o.value === sort)?.label} onValueChange={setSort}>
          <SelectTrigger className="w-40">
            <ArrowUpDown className="size-3.5 mr-1.5 shrink-0" />
            <SelectValue/>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8">Loading…</p>
      ) : songs.length === 0 ? (
        <p className="text-muted-foreground py-8">
          No submissions yet.{' '}
          <Link to="/submit" className="text-primary underline">
            Be the first to add one.
          </Link>
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-8">No submissions match your filters.</p>
      ) : (
        <div className="border border-border rounded-lg px-3">
          {filtered.map((song) => (
            <CuratedSongRow
              key={song.id}
              song={song}
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
