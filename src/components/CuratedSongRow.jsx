import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function formatDate(timestamp) {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function CuratedSongRow({ song }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 py-3 px-1 text-left hover:bg-accent/50 transition-colors rounded-sm group"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-primary tabular-nums w-10 shrink-0">
          {song.year}
        </span>
        <span className="flex-1 min-w-0">
          <span className="font-medium text-sm">{song.title}</span>
          <span className="text-muted-foreground text-sm"> — {song.artist}</span>
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-1 pb-4 pl-14">
          {song.story && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">{song.story}</p>
          )}
          {(song.submitterName || song.chosenAt) && (
            <p className="text-xs text-muted-foreground italic">
              {song.submitterName && <>Submitted by {song.submitterName}</>}
              {song.submitterName && song.chosenAt && ' · '}
              {song.chosenAt && formatDate(song.chosenAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
