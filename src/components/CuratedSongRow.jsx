import { useState } from 'react';
import { ChevronDown, ThumbsUp } from 'lucide-react';

function formatDate(timestamp) {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function CuratedSongRow({ song, voteCount = 0, userVoted = false, canVote = false, onVote }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-4 py-3 px-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center gap-4 text-left hover:bg-accent/50 transition-colors rounded-sm min-w-0"
          aria-expanded={open}
        >
          <span className="text-sm font-bold text-primary tabular-nums w-10 shrink-0">
            {song.year}
          </span>
          <span className="flex-1 min-w-0">
            <span className="font-medium text-sm">{song.title}</span>
            <span className="text-muted-foreground text-sm"> — {song.artist}</span>
          </span>
        </button>

        <button
          onClick={onVote}
          disabled={!canVote}
          aria-label={userVoted ? 'Remove upvote' : 'Upvote'}
          className={`flex items-center gap-1 shrink-0 transition-colors ${
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

        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Collapse' : 'Expand'}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && (
        <div className="px-1 pb-4 pl-14">
          {song.story && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">{song.story}</p>
          )}
          {(song.submitterName || song.chosenAt || song.createdAt) && (
            <p className="text-xs text-muted-foreground italic">
              {song.submitterName && <>Submitted by {song.submitterName}</>}
              {song.submitterName && (song.chosenAt || song.createdAt) && ' · '}
              {formatDate(song.chosenAt || song.createdAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
