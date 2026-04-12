import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const isAnonymous = !user || user.isAnonymous;

  async function handleSignOut() {
    await signOut(auth);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-sm tracking-tight hover:text-primary transition-colors no-underline text-foreground">
          Dialling in the Years
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="size-8 cursor-pointer">
                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'Profile'} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  <UserRound className="size-4" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            {isAnonymous ? (
              <>
                <DropdownMenuLabel className="text-muted-foreground font-normal text-xs">
                  Browsing as guest
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/login">Sign in / create account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/submit">Submit a song</Link>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium leading-none mb-1">
                    {user.displayName ?? 'No name set'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/my-submissions">Your submissions</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">Edit profile</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin panel</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  Sign out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
