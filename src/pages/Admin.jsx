import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { auth } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import {
  subscribeAllSubmissions,
  subscribeAllCuratedSongs,
  getUserEmail,
  updateSubmission,
  deleteSubmission,
  updateCuratedSong,
  deleteCuratedSong,
  addCuratedSong,
} from '@/firebase/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

// ─── Add curated song form ───────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

const curatedSchema = z.object({
  year: z.coerce.number().min(1955).max(CURRENT_YEAR, `Year must be ${CURRENT_YEAR} or earlier`),
  title: z.string().min(1, 'Required').max(200),
  artist: z.string().min(1, 'Required').max(200),
  story: z.string().min(1, 'Required').max(2000),
});

function AddCuratedForm({ onDone }) {
  const form = useForm({
    resolver: zodResolver(curatedSchema),
    defaultValues: { year: '', title: '', artist: '', story: '' },
  });

  async function onSubmit(values) {
    try {
      await addCuratedSong(values);
      toast.success('Curated song added.');
      form.reset();
      onDone?.();
    } catch {
      toast.error('Failed to add song.');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="year" render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl><Input type="number" min={1955} max={CURRENT_YEAR} {...field} /></FormControl>
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
        </div>
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Song title</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="story" render={({ field }) => (
          <FormItem>
            <FormLabel>Curator notes</FormLabel>
            <FormControl><Textarea className="min-h-24 resize-none" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding…' : 'Add song'}
        </Button>
      </form>
    </Form>
  );
}

// ─── Edit song dialog (title, artist, story) ─────────────────────────────────

const editSchema = z.object({
  title: z.string().min(1, 'Required').max(200),
  artist: z.string().min(1, 'Required').max(200),
  story: z.string().min(1, 'Required').max(2000),
});

function EditSongDialog({ open, onClose, song, onSave }) {
  const form = useForm({
    resolver: zodResolver(editSchema),
    values: {
      title: song?.title ?? '',
      artist: song?.artist ?? '',
      story: song?.story ?? '',
    },
  });

  async function handleSave(values) {
    await onSave(values);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit song</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="flex flex-col gap-4 mt-2">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
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
                <FormControl><Textarea className="min-h-32 resize-none" {...field} /></FormControl>
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

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteDialog({ open, onClose, onConfirm, label }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-white hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Submissions table ────────────────────────────────────────────────────────

function SubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [emails, setEmails] = useState({});   // uid → email
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    return subscribeAllSubmissions(setSubmissions, (err) => {
      toast.error('Failed to load submissions.');
      console.error(err);
    });
  }, []);

  // Fetch emails for UIDs we haven't loaded yet
  useEffect(() => {
    const uids = [...new Set(submissions.map((s) => s.uid).filter(Boolean))];
    uids.forEach(async (uid) => {
      if (uid in emails) return;
      const email = await getUserEmail(uid);
      setEmails((prev) => ({ ...prev, [uid]: email ?? '—' }));
    });
  }, [submissions]);

  async function toggleVisible(sub) {
    try {
      await updateSubmission(sub.id, { visible: !sub.visible });
      toast.success(sub.visible ? 'Submission hidden.' : 'Submission shown.');
    } catch {
      toast.error('Failed to update visibility.');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteSubmission(id);
      toast.success('Submission deleted.');
    } catch {
      toast.error('Failed to delete submission.');
    }
    setDeleteTarget(null);
  }

  async function handleSave(id, values) {
    try {
      await updateSubmission(id, values);
      toast.success('Submission updated.');
    } catch {
      toast.error('Failed to update submission.');
    }
  }

  return (
    <div>
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Year</TableHead>
              <TableHead>Title / Artist</TableHead>
              <TableHead>Submitted by</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No submissions yet.
                </TableCell>
              </TableRow>
            )}
            {submissions.map((sub) => (
              <TableRow key={sub.id} className={!sub.visible ? 'opacity-50' : ''}>
                <TableCell className="font-bold text-primary">{sub.year}</TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{sub.title}</p>
                  <p className="text-muted-foreground text-xs">{sub.artist}</p>
                </TableCell>
                <TableCell className="text-sm">{sub.submitterName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {emails[sub.uid] ?? 'Loading…'}
                </TableCell>
                <TableCell>
                  <Badge variant={sub.visible ? 'default' : 'secondary'}>
                    {sub.visible ? 'Visible' : 'Hidden'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditTarget(sub)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleVisible(sub)}>
                      {sub.visible ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(sub)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditSongDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        song={editTarget}
        onSave={(values) => handleSave(editTarget.id, values)}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget.id)}
        label={`"${deleteTarget?.title}"`}
      />
    </div>
  );
}

// ─── Curated songs table ──────────────────────────────────────────────────────

function CuratedTab() {
  const [songs, setSongs] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    return subscribeAllCuratedSongs(setSongs, (err) => {
      toast.error('Failed to load curated songs.');
      console.error(err);
    });
  }, []);

  async function toggleVisible(song) {
    try {
      await updateCuratedSong(song.id, { visible: !song.visible });
      toast.success(song.visible ? 'Song hidden.' : 'Song shown.');
    } catch {
      toast.error('Failed to update visibility.');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCuratedSong(id);
      toast.success('Song deleted.');
    } catch {
      toast.error('Failed to delete song.');
    }
    setDeleteTarget(null);
  }

  async function handleSave(id, values) {
    try {
      await updateCuratedSong(id, values);
      toast.success('Song updated.');
    } catch {
      toast.error('Failed to update song.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>Add curated song</Button>
      </div>

      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Year</TableHead>
              <TableHead>Title / Artist</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No curated songs yet.
                </TableCell>
              </TableRow>
            )}
            {songs.map((song) => (
              <TableRow key={song.id} className={!song.visible ? 'opacity-50' : ''}>
                <TableCell className="font-bold text-primary">{song.year}</TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{song.title}</p>
                  <p className="text-muted-foreground text-xs">{song.artist}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={song.visible ? 'default' : 'secondary'}>
                    {song.visible ? 'Visible' : 'Hidden'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditTarget(song)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleVisible(song)}>
                      {song.visible ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(song)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add song dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add curated song</DialogTitle></DialogHeader>
          <AddCuratedForm onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <EditSongDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        song={editTarget}
        onSave={(values) => handleSave(editTarget.id, values)}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget.id)}
        label={`"${deleteTarget?.title}"`}
      />
    </div>
  );
}

// ─── Admin page ───────────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut(auth);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Curator panel</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
      </div>

      <Separator className="mb-6" />

      <Tabs defaultValue="submissions">
        <TabsList className="mb-6">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="curated">Curated songs</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <SubmissionsTab />
        </TabsContent>

        <TabsContent value="curated">
          <CuratedTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
