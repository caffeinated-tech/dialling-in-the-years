import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { updateProfile } from 'firebase/auth';
import { completeEmailLinkSignIn, EMAIL_LINK_STORAGE_KEY } from '@/firebase/auth';
import { auth } from '@/firebase/config';
import { linkUserProfile, updateSubmitterName } from '@/firebase/firestore';
import Home from './pages/Home.jsx';
import MuseumPicks from './pages/MuseumPicks.jsx';
import Submissions from './pages/Submissions.jsx';
import Submit from './pages/Submit.jsx';
import MySubmissions from './pages/MySubmissions.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Admin from './pages/Admin.jsx';
import AdminGuard from './components/AdminGuard.jsx';
import Header from './components/Header.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * When the user clicks the email sign-in link, Firebase redirects them back
 * to window.location.origin. This component detects that on mount, completes
 * the linking, and cleans the URL.
 *
 * Edge case: if the user opened the link on a different device, localStorage
 * won't have the email — we show a small prompt to re-enter it.
 */
function EmailLinkHandler() {
  const [needsEmail, setNeedsEmail] = useState(false);
  const [pendingUid, setPendingUid] = useState(null);
  const [inputEmail, setInputEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function check() {
      const result = await completeEmailLinkSignIn(window.location.href);
      if (!result) return;

      if (result.needsEmail) {
        setPendingUid(result.previousAnonymousUid);
        setNeedsEmail(true);
        return;
      }

      await finish(result.user, result.previousAnonymousUid);
    }
    check().catch(console.error);
  }, []);

  async function finish(user, previousAnonymousUid) {
    // Only update user_profiles when completing an account-linking flow
    // (i.e. a visitor who submitted anonymously). Plain admin sign-ins skip this.
    if (previousAnonymousUid) {
      await linkUserProfile(user.uid, previousAnonymousUid);
      toast.success('Account linked — your submission is saved to your account.');
    }
    // Remove the Firebase link params from the URL without a page reload
    window.history.replaceState(null, '', window.location.pathname);
  }

  async function handleEmailSubmit() {
    setBusy(true);
    try {
      // Re-inject the email into localStorage so completeEmailLinkSignIn can use it
      localStorage.setItem(EMAIL_LINK_STORAGE_KEY, inputEmail);
      const result = await completeEmailLinkSignIn(window.location.href);
      if (result && !result.needsEmail) {
        setNeedsEmail(false);
        await finish(result.user, pendingUid);
      }
    } catch (err) {
      toast.error('Could not complete sign-in. The link may have expired.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!needsEmail) return null;

  return (
    <Dialog open onOpenChange={() => setNeedsEmail(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm your email</DialogTitle>
          <DialogDescription>
            It looks like you opened this link on a different device.
            Enter the email address you used to receive the sign-in link.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Input
            type="email"
            placeholder="you@example.com"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
          />
          <Button onClick={handleEmailSubmit} disabled={busy || !inputEmail} className="w-full">
            {busy ? 'Confirming…' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * After sign-in, if the user has no display name set, prompt them to choose one.
 * Skips anonymous users and admin accounts (which don't submit songs).
 */
function UsernamePrompt() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => auth.onAuthStateChanged((user) => {
    if (user && !user.isAnonymous && !user.displayName) {
      setOpen(true);
    }
  }), []);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await auth.currentUser.reload();
      await updateSubmitterName(auth.currentUser.uid, trimmed);
      setOpen(false);
      toast.success('Name saved.');
    } catch (err) {
      console.error(err);
      toast.error('Could not save your name. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose a display name</DialogTitle>
          <DialogDescription>
            This is the name that will appear on your submissions in the gallery.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <Button onClick={handleSave} disabled={busy || !name.trim()} className="w-full">
            {busy ? 'Saving…' : 'Save'}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)} className="w-full text-muted-foreground">
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function App() {
  return (
    <>
      <EmailLinkHandler />
      <UsernamePrompt />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/picks" element={<MuseumPicks />} />
        <Route path="/submissions" element={<Submissions />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/my-submissions" element={<MySubmissions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
