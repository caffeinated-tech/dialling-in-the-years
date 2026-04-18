import { useState } from 'react';
import { Star, ChevronDown, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatDate(timestamp) {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function SongCard({ song, showSubmitter = false, voteCount = 0, userVoted = false, canVote = false, onVote }) {
  const [open, setOpen] = useState(false);
  const hasDetails = song.story || (showSubmitter && (song.submitterName || song.createdAt));

  return (
    <Card className="flex flex-col hover:border-primary transition-colors">
      <div className="flex gap-3 p-4">
        <Badge
          variant="outline"
          className="self-start shrink-0 text-base font-extrabold text-primary border-primary/40 px-2 py-0.5 tracking-tight"
        >
          {song.year}
        </Badge>

        <button
          onClick={() => hasDetails && setOpen((o) => !o)}
          className="flex-1 text-left min-w-0"
          aria-expanded={hasDetails ? open : undefined}
          disabled={!hasDetails}
        >
          <CardContent className="p-0">
            <div className="flex items-center gap-1.5">
              {song.promoted && (
                <Star
                  className="size-3.5 fill-primary text-primary shrink-0"
                  aria-label="Promoted to museum pick"
                />
              )}
              <p className="font-bold text-sm truncate">{song.title}</p>
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">{song.artist}</p>
          </CardContent>
        </button>

        <div className="flex items-start gap-2 shrink-0">
          <button
            onClick={onVote}
            disabled={!canVote}
            aria-label={userVoted ? 'Remove upvote' : 'Upvote'}
            className={`flex items-center gap-1 mt-0.5 transition-colors ${
              userVoted
                ? 'text-primary'
                : canVote
                ? 'text-muted-foreground hover:text-primary'
                : 'text-muted-foreground opacity-40 cursor-not-allowed'
            }`}
          >
            <ThumbsUp className={`size-3.5 ${userVoted ? 'fill-primary' : ''}`} />
            <span className="text-xs tabular-nums">{voteCount}</span>
          </button>

          {hasDetails && (
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? 'Collapse' : 'Expand'}
              className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 -mt-1">
          {song.story && (
            <p className="text-muted-foreground text-xs leading-relaxed mb-2">{song.story}</p>
          )}
          {showSubmitter && (song.submitterName || song.createdAt) && (
            <p className="text-muted-foreground text-xs italic">
              {song.submitterName && <>Submitted by {song.submitterName}</>}
              {song.submitterName && song.createdAt && ' · '}
              {song.createdAt && formatDate(song.createdAt)}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
