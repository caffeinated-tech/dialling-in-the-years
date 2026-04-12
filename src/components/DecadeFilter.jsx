import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DecadeFilter({ songs, activDecade, onSelect }) {
  const decades = [...new Set(songs.map((s) => Math.floor(s.year / 10) * 10))].sort();

  if (decades.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by decade">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelect(null)}
        className={cn(
          'rounded-full text-xs',
          activDecade === null && 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground'
        )}
      >
        All
      </Button>
      {decades.map((decade) => (
        <Button
          key={decade}
          variant="outline"
          size="sm"
          onClick={() => onSelect(decade)}
          className={cn(
            'rounded-full text-xs',
            activDecade === decade && 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground'
          )}
        >
          {decade}s
        </Button>
      ))}
    </div>
  );
}
