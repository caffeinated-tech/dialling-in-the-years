import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { linkWithEmail, linkWithGoogle } from '@/firebase/auth';
import { linkUserProfile } from '@/firebase/firestore';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Post-submission nudge: offer the visitor the option to create an account
 * so they can track their submissions. Shown as a dismissible dialog.
 *
 * @param {boolean} open
 * @param {function} onClose
 * @param {string} anonymousUid - UID before linking, so we can update user_profiles
 */
export default function AccountNudge({ open, onClose, anonymousUid }) {
  const [view, setView] = useState('prompt'); // 'prompt' | 'email' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function handleEmailLink(values) {
    try {
      const { user } = await linkWithEmail(values.email, values.password);
      await linkUserProfile(user.uid, anonymousUid);
      setView('done');
    } catch (err) {
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
      setView('error');
    }
  }

  async function handleGoogleLink() {
    try {
      const { user } = await linkWithGoogle();
      await linkUserProfile(user.uid, anonymousUid);
      setView('done');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
      setView('error');
    }
  }

  function handleClose() {
    form.reset();
    setView('prompt');
    setErrorMsg('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">

        {view === 'prompt' && (
          <>
            <DialogHeader>
              <DialogTitle>Save your submission</DialogTitle>
              <DialogDescription>
                Create a free account to track your submissions and edit them later.
                You can skip this — your submission is already saved.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-2">
              <Button onClick={handleGoogleLink} variant="outline" className="w-full">
                Continue with Google
              </Button>
              <Button onClick={() => setView('email')} className="w-full">
                Continue with email
              </Button>
              <Button variant="ghost" onClick={handleClose} className="w-full text-muted-foreground">
                No thanks
              </Button>
            </div>
          </>
        )}

        {view === 'email' && (
          <>
            <DialogHeader>
              <DialogTitle>Create an account</DialogTitle>
              <DialogDescription>
                Choose a password to link your submission to an account.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailLink)} className="flex flex-col gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setView('prompt')} className="w-full text-muted-foreground">
                  Back
                </Button>
              </form>
            </Form>
          </>
        )}

        {view === 'done' && (
          <>
            <DialogHeader>
              <DialogTitle>Account created</DialogTitle>
              <DialogDescription>
                Your submission is now linked to your account.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleClose} className="w-full mt-2">Done</Button>
          </>
        )}

        {view === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle>Something went wrong</DialogTitle>
              <DialogDescription>{errorMsg}</DialogDescription>
            </DialogHeader>
            <Button onClick={() => setView('prompt')} variant="outline" className="w-full mt-2">
              Try again
            </Button>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
