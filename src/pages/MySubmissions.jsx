import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, Star } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/firebase/config';
import { subscribeUserSubmissions, updateOwnSubmission } from '@/firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  FormMessage,
} from '@/components/ui/form';

const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 1955;
const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);

const editSchema = z.object({
  year: z.coerce.number().min(START_YEAR).max(CURRENT_YEAR),
  title: z.string().min(1, 'Required').max(200),
  artist: z.string().min(1, 'Required').max(200),
  story: z.string().min(1, 'Required').max(2000),
  submitterName: z.string().min(1, 'Required').max(100),
});

function EditDialog({ open, onClose, submission }) {
  const form = useForm({
    resolver: zodResolver(editSchema),
    values: {
      year: String(submission?.year ?? CURRENT_YEAR),
      title: submission?.title ?? '',
      artist: submission?.artist ?? '',
      story: submission?.story ?? '',
      submitterName: submission?.submitterName ?? '',
    },
  });

  async function onSubmit(values) {
    try {
      await updateOwnSubmission(submission.id, values);
      toast.success('Submission updated.');
      onClose();
    } catch {
      toast.error('Could not save changes. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit submission</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="submitterName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Your name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Song title</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="artist" render={({ field }) => (
              <FormItem>
                <FormLabel>Artist</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="story" render={({ field }) => (
              <FormItem>
                <FormLabel>Story</FormLabel>
                <FormControl><Textarea className="min-h-28 resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionRow({ sub, onEdit }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border-b border-border last:border-0 ${!sub.visible ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4 py-3 px-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center gap-4 text-left hover:bg-accent/50 transition-colors rounded-sm min-w-0"
          aria-expanded={open}
        >
          <span className="text-sm font-bold text-primary tabular-nums w-10 shrink-0">
            {sub.year}
          </span>
          <span className="flex-1 min-w-0 flex items-center gap-1.5">
            {sub.promoted && (
              <Star className="size-3 fill-primary text-primary shrink-0" aria-label="Museum pick" />
            )}
            <span className="font-medium text-sm">{sub.title}</span>
            <span className="text-muted-foreground text-sm"> — {sub.artist}</span>
          </span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {!sub.visible && (
            <Badge variant="secondary" className="text-xs">Hidden</Badge>
          )}
          {sub.promoted && (
            <Badge variant="outline" className="text-xs text-primary border-primary/40">Pick</Badge>
          )}
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onEdit}>
            Edit
          </Button>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-1 pb-4 pl-14">
          {sub.story && (
            <p className="text-sm text-muted-foreground leading-relaxed">{sub.story}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MySubmissions() {
  const [user, setUser] = useState(auth.currentUser);
  const [submissions, setSubmissions] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => auth.onAuthStateChanged(setUser), []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    return subscribeUserSubmissions(
      user.uid,
      (data) => { setSubmissions(data); setLoading(false); },
      () => { toast.error('Could not load submissions.'); setLoading(false); }
    );
  }, [user?.uid]);

  if (!user || user.isAnonymous) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-3">Your submissions</h1>
        <p className="text-muted-foreground mb-6">
          Sign in with your account to view and edit your submissions.
        </p>
        <Button asChild>
          <Link to="/submit">Submit a song</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Button variant="ghost" asChild className="-ml-2 mb-4 text-muted-foreground">
          <Link to="/">← Back to gallery</Link>
        </Button>
        <h1 className="text-3xl font-bold mb-1">Your submissions</h1>
        <p className="text-muted-foreground text-sm">
          {submissions.length === 0 && !loading
            ? 'You haven\'t submitted any songs yet.'
            : `${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading && (
        <p className="text-muted-foreground">Loading…</p>
      )}

      {!loading && submissions.length === 0 && (
        <Button asChild>
          <Link to="/submit">Submit your first song</Link>
        </Button>
      )}

      <div className="border border-border rounded-lg px-3">
        {submissions.map((sub) => (
          <SubmissionRow key={sub.id} sub={sub} onEdit={() => setEditTarget(sub)} />
        ))}
      </div>

      <EditDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        submission={editTarget}
      />
    </main>
  );
}
