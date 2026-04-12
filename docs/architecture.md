# Architecture

## Why anonymous auth?

Visitors at the museum kiosk should be able to submit a song without creating an account. Firebase Anonymous Auth gives each visitor a real Firebase UID the moment they open the submission form — no sign-up friction. This UID is used to enforce Firestore write ownership rules (`submission.uid == request.auth.uid`) without exposing any personal data.

If the visitor later chooses to create an account, their anonymous session is merged into a verified account via `linkWithCredential`, and all their prior submissions remain associated with their identity.

## Account-linking flow (step by step)

1. Visitor opens `/submit`. The app calls `signInAnonymously()` if there is no active session. Firebase returns an anonymous UID.
2. Visitor fills in the form (year, title, artist, story, name, email).
3. On submit, the app writes two documents:
   - `submissions/{newId}` — all fields **except** email
   - `user_profiles/{anonymousUid}` — `{ email, isAnonymous: true, createdAt }`
4. A soft nudge appears: "Create an account to track your submissions." The visitor can dismiss it.
5. If the visitor chooses to create an account (email/password or Google):
   - Call `linkWithCredential(currentUser, credential)` (email/password) or `linkWithPopup(currentUser, googleProvider)`.
   - On success, the anonymous UID is merged into the verified account. The UID does not change, so all existing `submissions` documents still point to the correct user.
   - Update `user_profiles/{uid}`: set `isAnonymous: false`, append the old anonymous UID to `linkedUids`.
6. If `linkWithCredential` throws `auth/email-already-in-use`, the email belongs to an existing account. In that case, sign in with the existing credential (`signInWithCredential`) and merge the anonymous submissions manually by updating their `uid` field to the verified UID.

## Firestore collection structure

### `curated_songs`
Songs chosen by the museum curator covering 1955–present. Public read (visible documents only). Admin write only.

### `submissions`
Visitor-submitted songs covering 2001–present. Public read (visible documents only). Any authenticated user — including anonymous — can create a document for themselves. The `uid` field on each document is the submitter's Firebase UID.

### `user_profiles`
Holds each user's email address and account state. **No public access.** Only the document owner (`uid == request.auth.uid`) or an admin can read or write this collection.

The email address is isolated in `user_profiles` and must never appear on a `submissions` document. This is enforced at the Firestore rules level as well as in application code.

## Why email is isolated

Email is the only personally identifiable field collected. Storing it exclusively in `user_profiles` means:
- The public `submissions` query can never accidentally return an email, even if the rules are misconfigured.
- A GDPR deletion request is fulfilled by deleting the `user_profiles` document — no need to scan and redact `submissions`.
- Future developers cannot accidentally expose it by loosening `submissions` read rules.

## How admin access is granted

Admin status is stored as a Firebase Auth custom claim: `{ admin: true }`. Custom claims are set server-side using the Firebase Admin SDK and are embedded in the user's ID token, making them available in Firestore rules as `request.auth.token.admin`.

To grant admin to a curator account:

```
node scripts/grant-admin.js curator@museum.ie
```

See `scripts/grant-admin.js` for full instructions. The user must sign out and back in after the claim is set.

Custom claims were chosen over an `admins` Firestore collection because they are evaluated entirely within the Firebase Auth token — no extra Firestore read is needed on every rule evaluation, and they cannot be tampered with by a client.

## Firestore region

The Firestore database is located in `europe-west1` (Belgium) for EU data residency, which is appropriate given the museum's location and GDPR obligations. The region is set at project creation and cannot be changed.

## Emulator setup

During development, the app connects to the local Firebase Emulator Suite instead of production Firestore and Auth. Emulators run on:

| Service   | Port |
|-----------|------|
| Auth      | 9099 |
| Firestore | 8080 |
| Hosting   | 5000 |
| UI        | 4000 |

Start emulators with `firebase emulators:start`. The app auto-connects in development unless `VITE_USE_EMULATOR=false` is set.
