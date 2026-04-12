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
import { sendEmailLink } from '@/firebase/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

/**
 * Post-submission nudge: offer the visitor the option to create an account
 * so they can track their submissions. Shown as a dismissible dialog.
 *
 * Email linking uses a magic link (passwordless): the user enters their email,
 * receives a sign-in link, and the account is linked when they click it.
 * The completion is handled in App.jsx via completeEmailLinkSignIn.
 *
 * @param {boolean} open
 * @param {function} onClose
 * @param {string} anonymousUid - UID before linking, so we can update user_profiles
 */
export default function AccountNudge({ open, onClose, anonymousUid }) {
  const [view, setView] = useState('email'); // 'email' | 'sent' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function handleSendLink(values) {
    try {
      await sendEmailLink(values.email, anonymousUid);
      setView('sent');
    } catch (err) {
      setErrorMsg(err.message ?? 'Could not send the link. Please try again.');
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

        {view === 'email' && (
          <>
            <DialogHeader>
              <DialogTitle>Save your submission</DialogTitle>
              <DialogDescription>
                Enter your email and we'll send you a sign-in link — no password needed.
                Your submission is already saved.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSendLink)} className="flex flex-col gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? 'Sending…' : 'Send sign-in link'}
                </Button>
                <Button type="button" variant="ghost" onClick={handleClose} className="w-full text-muted-foreground">
                  No thanks
                </Button>
              </form>
            </Form>
          </>
        )}

        {view === 'sent' && (
          <>
            <DialogHeader>
              <DialogTitle>Check your email</DialogTitle>
              <DialogDescription>
                We've sent a sign-in link to{' '}
                <strong>{form.getValues('email')}</strong>.
                Click it to link your submission to your account.
              </DialogDescription>
            </DialogHeader>
            <p className="text-muted-foreground text-xs mt-2">
              The link works on any device. You can close this dialog.
            </p>
            <Button onClick={handleClose} variant="outline" className="w-full mt-2">
              Close
            </Button>
          </>
        )}

        {view === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle>Something went wrong</DialogTitle>
              <DialogDescription>{errorMsg}</DialogDescription>
            </DialogHeader>
            <Button onClick={() => setView('email')} variant="outline" className="w-full mt-2">
              Try again
            </Button>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
