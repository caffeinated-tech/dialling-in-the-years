# Dialling in the Years — Claude Code Handoff

## Project overview

A web app for the **Computer and Communications Museum** to accompany their rotary phone-booth exhibition. The physical exhibit lets visitors dial a year (1955–2000) and hear a song from that year played over the phone speaker. This web app extends that experience:

- Displays all curated songs (1955–present) chosen by the museum curator
- Accepts visitor song submissions for years 2001 to the current year
- Shows all visitor submissions in a public gallery
- Provides a curator admin panel to manage submissions and curated songs

The app must be **lightweight, low-cost, low-maintenance**, and easy for future developers to pick up. Keep dependencies minimal. Document every non-obvious decision.

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Large developer pool, fast builds, easy to hand over |
| Routing | React Router v6 | Stable API, well understood |
| Styling | Plain CSS | More durable than UI libraries for a long-lived project |
| Database | Firebase Firestore | Serverless, scales to zero cost, no server to maintain |
| Auth | Firebase Auth | Anonymous + email/password + Google sign-in |
| Hosting | Firebase Hosting | Free tier covers low-traffic museum site |

### Environment variables

All Firebase config values are public-safe (they identify the project, not authenticate to it — security is enforced by Firestore rules). Prefix with `VITE_` so Vite exposes them to the browser bundle.

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Commit a `.env.example` with these keys and empty values. Never commit a `.env` file with real values.

### Do not add
- State management libraries (Redux, Zustand) — React state + Firestore listeners is sufficient
- Component libraries (MUI, Chakra) — adds churn and weight
- Firebase Cloud Functions — not needed; email notifications are handled manually by the curator

---

## Firestore data model

### Collection: `curated_songs`
**Access: public read, admin write only**

| Field | Type | Notes |
|---|---|---|
| `year` | number | 1955–present |
| `title` | string | Song title |
| `artist` | string | |
| `story` | string | Curator's notes on the song |
| `chosenAt` | timestamp | Used to sort most-recently chosen to top of list |
| `visible` | boolean | Admin can hide without deleting |

### Collection: `submissions`
**Access: public read (visible only), authenticated write**

| Field | Type | Notes |
|---|---|---|
| `year` | number | 2001 – current year |
| `title` | string | |
| `artist` | string | |
| `story` | string | Visitor's story |
| `submitterName` | string | Display name — public |
| `uid` | string | Anonymous or verified Firebase UID — links to `user_profiles` |
| `createdAt` | timestamp | |
| `visible` | boolean | Default `true`; admin can set to `false` to hide |

> **Important:** The submitter's email must never appear on a `submissions` document. It lives exclusively in `user_profiles`.

### Collection: `user_profiles`
**Access: owner or admin only — no public access**

| Field | Type | Notes |
|---|---|---|
| `email` | string | Private. Readable only by the owning UID or an admin. |
| `isAnonymous` | boolean | `true` until account is verified via `linkWithCredential` |
| `linkedUids` | array | All anonymous UIDs merged into this account over time |
| `createdAt` | timestamp | |
| `deletedAt` | timestamp | Set on account deletion — triggers email erasure per GDPR policy |

---

## Firestore security rules

Write explicit security rules covering these requirements:

- `curated_songs`: anyone can read documents where `visible == true`; only admin users can create, update, or delete
- `submissions`: anyone can read documents where `visible == true`; any authenticated user (including anonymous) can create; only admins can update or delete
- `user_profiles`: only the document owner (`uid == request.auth.uid`) or an admin can read or write; absolutely no public access
- Admin status: use Firebase custom claims (`request.auth.token.admin == true`) or check against an `admins` collection
- `submissions` create rule must also enforce:
  - `request.resource.data.uid == request.auth.uid` — prevents a user submitting under another user's UID
  - `request.resource.data.year >= 2001 && request.resource.data.year <= int(request.time.toMillis() / 31536000000 + 1970)` — server-side year range guard (belt-and-suspenders alongside client validation)
  - `request.resource.data.keys().hasNone(['email'])` — belt-and-suspenders check that no email field is written to `submissions`

---

## Authentication flow

### Anonymous auth (submission flow)
1. On submission form load, silently call `signInAnonymously()` if no session exists
2. User fills in the form (year, title, artist, story, name, email)
3. On submit:
   - Write submission to `submissions` collection (no email field)
   - Write `{ email, isAnonymous: true, createdAt }` to `user_profiles/{anonymousUid}`
4. After successful submission, show a soft nudge: *"Create an account to track your submissions"* with email/password and Google sign-in options
5. If the user creates an account, call Firebase `linkWithCredential` to merge the anonymous session into the verified account
6. Update `user_profiles` document: set `isAnonymous: false`, append previous UID to `linkedUids`
7. All prior submissions (linked via `uid`) are now associated with the verified account

### Account linking
- Use `linkWithCredential` (email/password) or `linkWithPopup` (Google)
- After linking, update the `user_profiles` document to reflect the verified state
- If the email already exists as a verified account, use `signInWithCredential` to merge into the existing account instead

### Kiosk / shared device consideration
The form may be used on a shared museum kiosk. To prevent session bleed between visitors:
- Sign out anonymous users automatically after a period of inactivity (e.g. 5 minutes idle)
- Show a prominent "Done" or "Reset" button that clears the anonymous session
- Do not use `setPersistence(LOCAL)` for anonymous sessions on kiosk builds — use `SESSION` persistence so the session clears when the tab is closed

---

## Pages and routes

| Route | Page | Access |
|---|---|---|
| `/` | Home / gallery | Public |
| `/submit` | Submission form | Public (anonymous auth created silently) |
| `/admin` | Curator admin panel | Admin only — redirect to `/admin/login` if not authenticated |
| `/admin/login` | Admin sign-in | Public |

### Gallery page (`/`)

Two clearly separated sections on one page:

**Curated songs**
- All documents from `curated_songs` where `visible == true`
- Sorted by `chosenAt` descending (most recently chosen at top)
- Shows: year, title, artist, story

**Visitor submissions**
- All documents from `submissions` where `visible == true`
- Sorted by year
- Shows: year, title, artist, story, submitter name
- Email is never shown

Both sections support filtering/browsing by year or decade.

Layout must be **mobile-first** (visitors will primarily use their phones) but also comfortable on a desktop kiosk screen.

### Submission form (`/submit`)

Fields:
- Year — number input or select, range 2001 to current year (dynamic), required
- Song title — text, required
- Artist — text, required
- Story — textarea, required
- Your name — text, required (this is public)
- Your email — email input, required (this is private — goes to `user_profiles` only)

Validation:
- All fields required
- Year must be between 2001 and the current year
- Email must be a valid format
- Apply both client-side and Firestore rule-level validation

Spam protection:
- Add reCAPTCHA v3 or a honeypot hidden field

Post-submission:
- Show a thank-you confirmation state
- Soft nudge to create an account (not required, dismissible)

### Admin panel (`/admin`)

Curator must be signed in with an account that has admin privileges.

Features:
- List all submissions (including hidden ones), showing: year, title, artist, story, submitter name, email (read from `user_profiles`), visibility status, created date
- Per submission: hide/unhide, delete, edit story text
- List all curated songs with the same hide/unhide/delete/edit actions
- Add a new curated song (form: year, title, artist, story)
- When adding a curated song, `chosenAt` is set to `serverTimestamp()` so it floats to the top of the curated list

---

## Build phases

### Phase 1 — Foundation and data model (~1–2 weeks)
- Set up Firebase project (Firestore, Hosting, Auth) — **choose region at creation time** (cannot be changed; use `europe-west1` for EU/GDPR compliance)
- Initialise React + Vite project, configure Firebase SDK
- Set up GitHub repo with CI/CD deploy to Firebase Hosting on push to `main` — add `FIREBASE_SERVICE_ACCOUNT` secret to the repo for the GitHub Actions deploy step
- Install and configure the **Firebase Emulator Suite** (Firestore + Auth emulators) for local development and rule testing
- Define the three Firestore collections and write security rules (see constraints below)
- Create the composite index for `curated_songs`: `visible ASC, chosenAt DESC` — required for the gallery query
- Test security rules thoroughly using the emulator — especially that email is inaccessible publicly
- Write and test the **admin bootstrap script** (Firebase Admin SDK or CLI) that grants the `admin: true` custom claim to the first curator account
- Commit a short `docs/architecture.md` explaining the anonymous auth and account-linking approach
- Commit a `.env.example` file documenting all required environment variables (see below)

### Phase 2 — Gallery and curated songs (~1 week)
- Build the public gallery page with both sections
- Seed `curated_songs` collection with all existing 1955–2000 exhibition songs
- Implement year/decade filtering
- Responsive layout: mobile-first

### Phase 3 — Submission form and auth flow (~1–2 weeks)
- Build the submission form with all fields and validation
- Implement silent anonymous auth on form load
- Write submission to `submissions`, email to `user_profiles`
- Build the post-submission account nudge flow
- Implement `linkWithCredential` account linking
- Add kiosk session reset behaviour

### Phase 4 — Curator admin panel (~1–2 weeks)
- Firebase Auth login page for admin users
- Admin dashboard: view all submissions with email, hide/unhide/delete/edit
- Add and manage curated songs
- Firestore rules: all admin writes gated behind custom claims or role check

### Phase 5 — Polish, docs, and handover (~1 week)
- Accessibility audit: keyboard navigation, screen reader labels, WCAG AA colour contrast
- Test on museum hardware (phone, kiosk screen)
- Add privacy notice to submission form
- Set Firebase budget alert (e.g. alert at €5/month)
- Write all documentation (see below)
- Final deploy, custom domain, smoke test

---

## Documentation to write (commit to repo)

All docs should be short and plain-language.

### `README.md`
- What the project is
- Local setup instructions
- Environment variables required
- How to deploy

### `docs/architecture.md`
- Why anonymous auth was chosen
- How the account-linking flow works step by step
- Firestore collection structure and the reason email is isolated
- How admin access is granted

### `docs/curator-guide.md`
Non-technical guide for museum staff covering:
- How to log in to the admin panel
- How to hide or delete a submission
- How to add a new curated song
- How to add or remove admin accounts
- What to do if a visitor asks to have their submission or account deleted

### `docs/gdpr.md`
- The museum is the data controller
- What personal data is collected (email address, submitter name)
- Where it is stored (Firebase Firestore, `user_profiles` collection)
- Retention policy: email retained until the user deletes their account
- How to fulfil a deletion request: delete the `user_profiles` document and set `deletedAt` timestamp
- How to contact the data controller

---

## Launch checklist

### Infrastructure
- [ ] Firebase project created, Firestore in production mode
- [ ] Security rules written, tested, reviewed for email privacy
- [ ] Firebase Hosting configured with custom domain
- [ ] Budget alert set (alert at €5/month)
- [ ] GitHub repo with automated deploy on push to `main`
- [ ] Architecture decision record committed to repo

### Data and content
- [ ] All existing 1955–2000 curated songs seeded into Firestore
- [ ] At least one test submission visible in the gallery
- [ ] All curator admin accounts created and tested

### Privacy and security
- [ ] Email field confirmed inaccessible via public Firestore query
- [ ] Privacy notice present on submission form
- [ ] GDPR data retention policy documented
- [ ] Kiosk session reset confirmed — anonymous session clears between visitors
- [ ] Spam protection in place

### Testing and docs
- [ ] Tested end-to-end on a phone browser
- [ ] Tested on museum kiosk / desktop screen
- [ ] Account-linking flow tested: submit anonymously, then create account, confirm submissions carry over
- [ ] All four documentation files written and committed
- [ ] Curator guide shared with all admin users

---

## Open decisions for build time

**Kiosk auth strategy** — If a visitor creates an account at the museum kiosk and walks away without signing out, the next visitor could see their account. Recommended solution: auto sign-out anonymous sessions after 5 minutes of inactivity, plus a visible "Done" button. Confirm the chosen approach before starting Phase 3.

**Admin privilege mechanism** — Choose between Firebase custom claims (requires a setup script to grant admin) or an `admins` Firestore collection (easier to manage but slightly less secure). Custom claims are recommended for production. The bootstrap script must be written and tested in Phase 1 so the admin panel can be tested in Phase 4.

---

## Constraints and principles

- **Low cost**: Firebase free (Spark) tier should cover this project indefinitely at museum traffic levels. Set a budget alert to catch anything unexpected.
- **Low maintenance**: Minimise dependencies. Every package added is a future security update. Prefer built-in browser APIs and Firebase SDK features over third-party libraries.
- **Long-lived**: This app needs to run for many years. Write clear code, commit all decisions to documentation, and avoid clever abstractions that future maintainers won't understand.
- **Findable maintainers**: React, Vite, and Firebase are all mainstream — any web developer can pick this up.
- **Privacy by design**: The email address is the only sensitive field. It must never appear on a public document. This is a data model constraint, not just a security rule.