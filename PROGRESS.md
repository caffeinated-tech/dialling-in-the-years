# Dialling in the Years — Progress

Web app for the Computer and Communications Museum's rotary phone-booth exhibition.
Visitors submit songs that defined a year for them; curators manage a separate picks list.

---

## Stack

- **Frontend**: React 18 + Vite 8, React Router v6
- **Styling**: Tailwind CSS v4 + shadcn/ui (base-nova, amber primary palette)
- **Backend**: Firebase — Firestore, Auth (anonymous + email magic link), Hosting
- **Forms**: react-hook-form + zod
- **Icons**: lucide-react

---

## What's been built

### Phase 1 — Infrastructure
- Firebase project config (Firestore, Auth, Hosting, emulator suite)
- Vite + React scaffold with Tailwind v4 and shadcn/ui
- `@/` path alias, rolldown-compatible `manualChunks`
- GitHub Actions CI/CD deploying to Firebase Hosting on push to main
- `scripts/grant-admin.js` — sets `admin: true` custom claim; `--emulator` flag for local dev
- `.gitignore` excluding `serviceAccountKey.json`

### Phase 2 — Public gallery
- Gallery page with two sections: **Museum picks** and **Visitor submissions**
- `SongCard` component (year badge, title, artist, story, submitter)
- `DecadeFilter` component for filtering both sections by decade
- Firestore subscriptions with real-time updates
- Star badge (⭐) on submissions promoted to museum picks

### Phase 3 — Submission flow
- Anonymous Firebase Auth on kiosk (SESSION persistence — clears on tab close)
- Submission form with honeypot spam protection
- Optional email field (stored only in `user_profiles`, never on the submission)
- `useKioskReset` hook — signs out anonymous user after 5 min idle or "Done" press
- `AccountNudge` dialog — post-submission prompt to save account via email magic link
- `EmailLinkHandler` in `App.jsx` — completes email-link sign-in on redirect, handles
  different-device edge case (prompts for email re-entry)
- Email and display name pre-filled and disabled for already-signed-in users

### Phase 4 — Curator admin panel
- `/admin` route guarded by `AdminGuard` (checks `admin` custom claim)
- `/admin/login` with passwordless email magic link
- **Submissions tab**: view all submissions (including hidden), see submitter email,
  edit title/artist/story/year/name, toggle visibility, delete, promote to museum pick
- **Curated songs tab**: view all curator picks, edit, toggle visibility, delete, add new
- Promote flow: creates curated song + stamps `promoted: true` on the submission

### Phase 5 — User accounts & profile
- `/login` page — email magic link sign-in (no password, no Google)
- `/profile` page — edit display name, sign out; redirects anonymous users away
- **Header** — sticky top bar with app title and avatar dropdown:
  - Guest: "Browsing as guest" + links to Sign in and Submit
  - Signed-in: name, email, links to My Submissions / Edit Profile / Admin (if admin)
  - Generic profile silhouette icon (no initials)
- `/my-submissions` — user's own submissions (including hidden), editable inline,
  shows "Hidden by curator" and "Museum pick" badges
- Sign-out removed from admin panel — now in the header dropdown

### Data integrity
- **One curated song per year** — Firestore document ID is the year string; `addCuratedSong`
  checks for duplicates before writing; Firestore rule enforces `songId == year`
- **Timestamps** — submissions store `createdAt` and `updatedAt`; `updatedAt` is bumped
  on every user edit and never touched by curator writes; enforced in rules
- **Name sync** — changing display name on `/profile` updates `submitterName` on all
  the user's submissions and curated songs (including legacy records via year lookup +
  uid backfill); Firestore rules allow this scoped update
- **Email privacy** — email never stored on submission documents; only in `user_profiles`
- **Security rules** — immutable fields (uid, visible, promoted, createdAt) locked on
  owner updates; admin custom claim gates all curator writes

---

## Firestore collections

| Collection | Document ID | Key fields |
|---|---|---|
| `curated_songs` | year (string) | year, title, artist, story, submitterName, uid, visible, chosenAt |
| `submissions` | auto | year, title, artist, story, submitterName, uid, visible, promoted, createdAt, updatedAt |
| `user_profiles` | uid | email, isAnonymous, createdAt, linkedUids |

---

## What's left to do

### Likely needed before launch
- [ ] **Privacy policy page** (`/privacy`) — referenced in the submission form footer
- [ ] **Deploy to production** — `firebase deploy` with real project credentials,
      set authorised domain in Firebase console for email links
- [ ] **Seed curated songs** — populate the museum picks for 1955–present via admin panel
- [ ] **Test email links in production** — magic link redirect URL must be whitelisted
      in Firebase Authentication → Settings → Authorised domains
- [ ] **Admin account setup** — run `node scripts/grant-admin.js <email>` against production

### Nice to have
- [ ] **Search / filter** on submissions and curated songs
- [ ] **Pagination or virtual scroll** — the lists will grow long over the exhibition run
- [ ] **Submission moderation queue** — currently all submissions are immediately visible;
      could add `visible: false` default + admin approval step
- [ ] **Data export** — admin ability to download submissions as CSV for archiving
- [ ] **Account deletion / data erasure** — GDPR right to erasure; user can request via
      email today but no self-serve flow exists
- [ ] **Rate limiting** — anonymous users could spam submissions; could add a
      Firestore rule or Cloud Function to cap submissions per IP/session
- [ ] **Accessibility audit** — keyboard navigation, screen reader testing,
      colour contrast check against WCAG AA
- [ ] **Analytics** — optional, e.g. Firebase Analytics or a privacy-friendly alternative
