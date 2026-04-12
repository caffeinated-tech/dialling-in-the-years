import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SongCard({ song, showSubmitter = false }) {
  return (
    <Card className="flex gap-3 p-4 hover:border-primary transition-colors">
      <Badge
        variant="outline"
        className="self-start shrink-0 text-base font-extrabold text-primary border-primary/40 px-2 py-0.5 tracking-tight"
      >
        {song.year}
      </Badge>
      <CardContent className="p-0 flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{song.title}</p>
        <p className="text-muted-foreground text-xs mt-0.5 mb-2">{song.artist}</p>
        {song.story && (
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
            {song.story}
          </p>
        )}
        {showSubmitter && song.submitterName && (
          <p className="text-muted-foreground text-xs mt-2 italic">
            Submitted by {song.submitterName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
