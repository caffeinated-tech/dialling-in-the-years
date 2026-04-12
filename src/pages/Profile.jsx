import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile, signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/firebase/config';
import { updateSubmitterName } from '@/firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';

const schema = z.object({
  displayName: z.string().min(1, 'Name cannot be empty').max(100),
});

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => auth.onAuthStateChanged((u) => {
    setUser(u);
    if (!u || u.isAnonymous) navigate('/', { replace: true });
  }), []);

  const form = useForm({
    resolver: zodResolver(schema),
    values: { displayName: user?.displayName ?? '' },
  });

  async function onSubmit(values) {
    try {
      await updateProfile(auth.currentUser, { displayName: values.displayName });
      await updateSubmitterName(auth.currentUser.uid, values.displayName);
      setUser({ ...auth.currentUser });
      toast.success('Name updated.');
    } catch {
      toast.error('Could not update name. Please try again.');
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    navigate('/');
  }

  if (!user || user.isAnonymous) return null;

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <div className="mb-8">
        <Button variant="ghost" asChild className="-ml-2 mb-4 text-muted-foreground">
          <Link to="/">← Back to gallery</Link>
        </Button>
        <h1 className="text-3xl font-bold mb-1">Your profile</h1>
        {user.email && (
          <p className="text-muted-foreground text-sm">{user.email}</p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name shown on your submissions in the gallery.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Form>

      <Separator className="my-8" />

      <div>
        <h2 className="text-sm font-semibold mb-1">Sign out</h2>
        <p className="text-muted-foreground text-sm mb-4">
          You'll need to use your email link to sign back in.
        </p>
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
