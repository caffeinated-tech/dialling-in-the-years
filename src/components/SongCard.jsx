import { useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatDate(timestamp) {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function SongCard({ song, showSubmitter = false }) {
  const [open, setOpen] = useState(false);
  const hasDetails = song.story || (showSubmitter && (song.submitterName || song.createdAt));

  return (
    <Card className="flex flex-col hover:border-primary transition-colors">
      <button
        onClick={() => hasDetails && setOpen((o) => !o)}
        className="flex gap-3 p-4 text-left w-full"
        aria-expanded={hasDetails ? open : undefined}
        disabled={!hasDetails}
      >
        <Badge
          variant="outline"
          className="self-start shrink-0 text-base font-extrabold text-primary border-primary/40 px-2 py-0.5 tracking-tight"
        >
          {song.year}
        </Badge>
        <CardContent className="p-0 flex-1 min-w-0">
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
        {hasDetails && (
          <ChevronDown
            className={`size-4 text-muted-foreground shrink-0 self-start mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

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
