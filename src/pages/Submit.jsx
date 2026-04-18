import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth } from '@/firebase/config';
import { signInAnonymouslyForKiosk } from '@/firebase/auth';
import { createSubmission } from '@/firebase/firestore';
import { useKioskReset } from '@/hooks/useKioskReset';
import AccountNudge from '@/components/AccountNudge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';

const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 1955;
const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);

const schema = z.object({
  year: z.coerce.number().min(START_YEAR).max(CURRENT_YEAR),
  title: z.string().min(1, 'Required').max(200),
  artist: z.string().min(1, 'Required').max(200),
  story: z.string().min(1, 'Required').max(2000),
  submitterName: z.string().min(1, 'Required').max(100),
  email: z.union([z.string().email('Enter a valid email address'), z.literal('')]).optional(),
  // Honeypot — must stay empty; bots fill it in
  _hp: z.string().max(0, '').optional(),
});

export default function Submit() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const anonymousUidRef = useRef(null);

  // Sign in anonymously on mount
  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymouslyForKiosk().then(setUser).catch(console.error);
    } else {
      setUser(auth.currentUser);
    }
    return auth.onAuthStateChanged(setUser);
  }, []);

  // Pre-fill email and display name from Firebase Auth when a verified user is signed in
  useEffect(() => {
    if (user?.email) form.setValue('email', user.email);
    if (user?.displayName) form.setValue('submitterName', user.displayName);
  }, [user?.email, user?.displayName]);

  // Kiosk reset: sign out anonymous user after 5 min idle, or on "Done" press
  const { resetSession } = useKioskReset(user?.isAnonymous, () => navigate('/'));

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      year: String(CURRENT_YEAR),
      title: '',
      artist: '',
      story: '',
      submitterName: '',
      email: '',
      _hp: '',
    },
  });

  async function onSubmit(values) {
    // Honeypot check — silently succeed so bots get no signal
    if (values._hp) {
      setSubmitted(true);
      return;
    }

    if (!user) {
      setSubmitError('Authentication error. Please refresh and try again.');
      return;
    }

    setSubmitError(null);
    try {
      await createSubmission(
        {
          year: values.year,
          title: values.title,
          artist: values.artist,
          story: values.story,
          submitterName: values.submitterName,
          email: values.email,
        },
        user.uid,
        user.isAnonymous
      );
      anonymousUidRef.current = user.uid;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitError('Could not save your submission. Please try again.');
    }
  }

  // ── Thank-you state ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-3">Thank you!</h1>
        <p className="text-muted-foreground mb-8">
          Your submission has been saved and will appear in the gallery.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => setNudgeOpen(true)}>Save your account</Button>
          {user && !user.isAnonymous && (
            <Button variant="outline" asChild>
              <Link to="/my-submissions">View your submissions</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/">Back to gallery</Link>
          </Button>
          <Button variant="ghost" onClick={resetSession} className="text-muted-foreground">
            Done (clear session)
          </Button>
        </div>

        <AccountNudge
          open={nudgeOpen}
          onClose={() => setNudgeOpen(false)}
          anonymousUid={anonymousUidRef.current}
        />
      </main>
    );
  }

  // ── Submission form ────────────────────────────────────────────────────────
  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link to="/">← Back to gallery</Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Submit a song</h1>
        <p className="text-muted-foreground">
          Tell us about a song that defined a year for you (1955–present).
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

          {/* ── Honeypot — hidden from real users ── */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
            {...form.register('_hp')}
          />

          {/* Year */}
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Song title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Song title</FormLabel>
                <FormControl><Input placeholder="e.g. Mr. Brightside" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Artist */}
          <FormField
            control={form.control}
            name="artist"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Artist</FormLabel>
                <FormControl><Input placeholder="e.g. The Killers" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Story */}
          <FormField
            control={form.control}
            name="story"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your story</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Why does this song represent that year for you?"
                    className="resize-none min-h-28"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Name — hidden when the logged-in user already has a display name */}
          {!user?.displayName && (
            <FormField
              control={form.control}
              name="submitterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="How you'd like to appear in the gallery"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>This will be shown publicly with your submission.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your email <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={!!user?.email}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {user?.email
                    ? 'Using the email address from your account.'
                    : 'Optional. Private — never shown publicly. Needed only if you want to edit your submission or request data deletion.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Privacy notice */}
          <p className="text-xs text-muted-foreground border border-border rounded-md p-3">
            <strong>Privacy:</strong> Your email address is stored privately and will never appear
            in the gallery. The museum is the data controller.
            See our <Link to="/privacy" className="underline">privacy policy</Link> for details.
          </p>

          {submitError && (
            <p className="text-destructive text-sm">{submitError}</p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting || !user}
            className="w-full"
          >
            {form.formState.isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>

        </form>
      </Form>

      {/* Kiosk "Done" button — clears the anonymous session */}
      <div className="mt-8 pt-6 border-t border-border text-center">
        <Button variant="ghost" onClick={resetSession} className="text-muted-foreground text-sm">
          Done — clear this session
        </Button>
        <p className="text-muted-foreground text-xs mt-1">
          Use this on a shared device to prevent the next visitor seeing your session.
        </p>
      </div>

    </main>
  );
}
