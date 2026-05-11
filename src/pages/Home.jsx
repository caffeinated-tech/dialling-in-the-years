import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Phone, Music, Users } from 'lucide-react';
import Logo from '@/components/Logo';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const photos = [1, 2, 3, 4, 5, 6].map(n => `/photos/${n}.jpeg`);

export default function Home() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <main className="max-w-2xl mx-auto px-4 pb-16 pt-16">

      <div className="text-center mb-12">
        <Logo className="h-24 w-auto mx-auto mb-6 text-primary" />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Phoning in the Years
        </h1>
        <p className="text-muted-foreground text-lg">
          A song for every year, chosen by the museum and by you.
        </p>
      </div>
      <div className="space-y-4 mb-12 text-muted-foreground leading-relaxed">
        <p>
          At the <a href="https://ccmireland.com/" className="text-primary hover:underline">Computer and Communications Museum of Ireland, Galway</a>, we have 
          built a very special phone booth. Using the original rotary dial phone from outside the canteen at the 
          University of Galway.
        </p>
        <p>
          Unlike the other phones inside the museum, this one isn't hooked to our working local switchboard.
          Instead, if you dial a number between 1955-2000 then a song from that year will play from the handset.
          They have been personally selected by our museum curator Brendan Smith. He has a story to go with each of song 
          - if you are visiting and curious, be sure to ask him about your favourites. 
        </p>
        <p>
          Now we are reaching out to you to pick the songs from 2001 onwards. Tell us what song defined a year for you, 
          share your story, and become part of the exhibition. 
        </p> 
        <p>
          You can browse the full list of picks, submit your own song for any year from 2001 onwards, and
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

      <div className="mt-16">
        <div className="grid grid-cols-3 gap-2">
          {photos.map((src) => (
            <button
              key={src}
              onClick={() => setSelectedPhoto(src)}
              className="aspect-square overflow-hidden rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
              />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={selectedPhoto !== null} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent
          showCloseButton
          className="w-fit max-w-[calc(100vw-40px)] sm:max-w-[calc(100vw-40px)] max-h-[calc(100vh-40px)] p-0 overflow-hidden bg-black border-0"
        >
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt=""
              className="block max-w-[calc(100vw-40px)] max-h-[calc(100vh-40px)] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

    </main>
  );
}
