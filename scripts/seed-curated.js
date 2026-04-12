#!/usr/bin/env node
/**
 * seed-curated.js
 *
 * Seeds the `curated_songs` collection with placeholder data for 1955–2000.
 * Safe to re-run — uses the year as the document ID so it won't create
 * duplicates, but will overwrite existing documents for the same year.
 *
 * Prerequisites:
 *   - scripts/serviceAccountKey.json must exist (see grant-admin.js for instructions)
 *
 * Usage:
 *   node scripts/seed-curated.js
 *
 * To target the local emulator instead of production:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/seed-curated.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccountPath = resolve(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch {
  // If running against the emulator, service account credentials aren't needed.
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error(
      'Error: could not read scripts/serviceAccountKey.json\n' +
      'Download it from Firebase console → Project Settings → Service accounts\n' +
      'Or run against the emulator: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/seed-curated.js'
    );
    process.exit(1);
  }
}

if (serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} else {
  // Emulator mode — no credentials needed
  admin.initializeApp({ projectId: 'galway-museum-phone-booth' });
}

const db = admin.firestore();

// Placeholder songs — replace with real curator data before launch.
// Each document ID is the year (as a string) to prevent duplicates on re-seed.
const songs = [
  { year: 1955, title: 'Song-1', artist: 'Artist-1', story: 'Placeholder story for 1955.' },
  { year: 1956, title: 'Song-2', artist: 'Artist-2', story: 'Placeholder story for 1956.' },
  { year: 1957, title: 'Song-3', artist: 'Artist-3', story: 'Placeholder story for 1957.' },
  { year: 1958, title: 'Song-4', artist: 'Artist-4', story: 'Placeholder story for 1958.' },
  { year: 1959, title: 'Song-5', artist: 'Artist-5', story: 'Placeholder story for 1959.' },
  { year: 1960, title: 'Song-6', artist: 'Artist-6', story: 'Placeholder story for 1960.' },
  { year: 1961, title: 'Song-7', artist: 'Artist-7', story: 'Placeholder story for 1961.' },
  { year: 1962, title: 'Song-8', artist: 'Artist-8', story: 'Placeholder story for 1962.' },
  { year: 1963, title: 'Song-9', artist: 'Artist-9', story: 'Placeholder story for 1963.' },
  { year: 1964, title: 'Song-10', artist: 'Artist-10', story: 'Placeholder story for 1964.' },
  { year: 1965, title: 'Song-11', artist: 'Artist-11', story: 'Placeholder story for 1965.' },
  { year: 1966, title: 'Song-12', artist: 'Artist-12', story: 'Placeholder story for 1966.' },
  { year: 1967, title: 'Song-13', artist: 'Artist-13', story: 'Placeholder story for 1967.' },
  { year: 1968, title: 'Song-14', artist: 'Artist-14', story: 'Placeholder story for 1968.' },
  { year: 1969, title: 'Song-15', artist: 'Artist-15', story: 'Placeholder story for 1969.' },
  { year: 1970, title: 'Song-16', artist: 'Artist-16', story: 'Placeholder story for 1970.' },
  { year: 1971, title: 'Song-17', artist: 'Artist-17', story: 'Placeholder story for 1971.' },
  { year: 1972, title: 'Song-18', artist: 'Artist-18', story: 'Placeholder story for 1972.' },
  { year: 1973, title: 'Song-19', artist: 'Artist-19', story: 'Placeholder story for 1973.' },
  { year: 1974, title: 'Song-20', artist: 'Artist-20', story: 'Placeholder story for 1974.' },
  { year: 1975, title: 'Song-21', artist: 'Artist-21', story: 'Placeholder story for 1975.' },
  { year: 1976, title: 'Song-22', artist: 'Artist-22', story: 'Placeholder story for 1976.' },
  { year: 1977, title: 'Song-23', artist: 'Artist-23', story: 'Placeholder story for 1977.' },
  { year: 1978, title: 'Song-24', artist: 'Artist-24', story: 'Placeholder story for 1978.' },
  { year: 1979, title: 'Song-25', artist: 'Artist-25', story: 'Placeholder story for 1979.' },
  { year: 1980, title: 'Song-26', artist: 'Artist-26', story: 'Placeholder story for 1980.' },
  { year: 1981, title: 'Song-27', artist: 'Artist-27', story: 'Placeholder story for 1981.' },
  { year: 1982, title: 'Song-28', artist: 'Artist-28', story: 'Placeholder story for 1982.' },
  { year: 1983, title: 'Song-29', artist: 'Artist-29', story: 'Placeholder story for 1983.' },
  { year: 1984, title: 'Song-30', artist: 'Artist-30', story: 'Placeholder story for 1984.' },
  { year: 1985, title: 'Song-31', artist: 'Artist-31', story: 'Placeholder story for 1985.' },
  { year: 1986, title: 'Song-32', artist: 'Artist-32', story: 'Placeholder story for 1986.' },
  { year: 1987, title: 'Song-33', artist: 'Artist-33', story: 'Placeholder story for 1987.' },
  { year: 1988, title: 'Song-34', artist: 'Artist-34', story: 'Placeholder story for 1988.' },
  { year: 1989, title: 'Song-35', artist: 'Artist-35', story: 'Placeholder story for 1989.' },
  { year: 1990, title: 'Song-36', artist: 'Artist-36', story: 'Placeholder story for 1990.' },
  { year: 1991, title: 'Song-37', artist: 'Artist-37', story: 'Placeholder story for 1991.' },
  { year: 1992, title: 'Song-38', artist: 'Artist-38', story: 'Placeholder story for 1992.' },
  { year: 1993, title: 'Song-39', artist: 'Artist-39', story: 'Placeholder story for 1993.' },
  { year: 1994, title: 'Song-40', artist: 'Artist-40', story: 'Placeholder story for 1994.' },
  { year: 1995, title: 'Song-41', artist: 'Artist-41', story: 'Placeholder story for 1995.' },
  { year: 1996, title: 'Song-42', artist: 'Artist-42', story: 'Placeholder story for 1996.' },
  { year: 1997, title: 'Song-43', artist: 'Artist-43', story: 'Placeholder story for 1997.' },
  { year: 1998, title: 'Song-44', artist: 'Artist-44', story: 'Placeholder story for 1998.' },
  { year: 1999, title: 'Song-45', artist: 'Artist-45', story: 'Placeholder story for 1999.' },
  { year: 2000, title: 'Song-46', artist: 'Artist-46', story: 'Placeholder story for 2000.' },
];

async function seed() {
  const batch = db.batch();

  for (const song of songs) {
    const ref = db.collection('curated_songs').doc(String(song.year));
    batch.set(ref, {
      ...song,
      visible: true,
      chosenAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`Seeded ${songs.length} curated songs.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
