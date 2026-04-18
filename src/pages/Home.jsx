import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Phone, Music, Users } from 'lucide-react';

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-4 pb-16 pt-16">

      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Dialling in the Years
        </h1>
        <p className="text-muted-foreground text-lg">
          A song for every year, chosen by the museum and by you.
        </p>
      </div>

      <div className="space-y-4 mb-12 text-muted-foreground leading-relaxed">
        <p>
          Pick up the handset of the old rotary phone in the exhibit, dial a year between
          1955 and 2000, and hear the song the museum has chosen to represent that moment in time.
        </p>
        <p>
          Each song was selected by the curator to capture something of the mood, the culture,
          or the history of its year — spanning rock and roll, folk, disco, and everything in between.
        </p>
        <p>
          Think the museum got it right? Think they missed something obvious? You can browse
          the full list of picks, submit your own song for any year from 2001 onwards, and
          vote for the songs you love.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link to="/picks" className={cn(buttonVariants({ size: 'lg' }), 'w-full gap-2')}>
          <Music className="size-4" />
          Museum picks
        </Link>
        <Link to="/submissions" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'w-full gap-2')}>
          <Users className="size-4" />
          Visitor songs
        </Link>
        <Link to="/submit" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'w-full gap-2')}>
          <Phone className="size-4" />
          Submit a song
        </Link>
      </div>

    </main>
  );
}
