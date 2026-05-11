#!/usr/bin/env node
/**
 * migrate-uid.js
 *
 * Reassigns all submissions and curated_songs from one UID to another.
 * Useful when a user's Auth account is replaced (e.g. anonymous → permanent).
 *
 * Usage:
 *   node scripts/migrate-uid.js <fromUid> <toUid> [--name <submitterName>] [--emulator] [--dry-run]
 *
 * Examples:
 *   # Dry run against production to preview changes:
 *   node scripts/migrate-uid.js OLD_UID NEW_UID --dry-run
 *
 *   # Live run against production, also updating submitterName:
 *   node scripts/migrate-uid.js OLD_UID NEW_UID --name "Jane Smith"
 *
 *   # Against local emulators:
 *   node scripts/migrate-uid.js OLD_UID NEW_UID --emulator
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const [fromUid, toUid] = args.filter(a => !a.startsWith('--'));
const emulator = args.includes('--emulator');
const dryRun = args.includes('--dry-run');
const nameIdx = args.indexOf('--name');
const newName = nameIdx !== -1 ? args[nameIdx + 1] : null;

if (!fromUid || !toUid) {
  console.error('Usage: node scripts/migrate-uid.js <fromUid> <toUid> [--emulator] [--dry-run]');
  process.exit(1);
}

if (fromUid === toUid) {
  console.error('fromUid and toUid are the same — nothing to do.');
  process.exit(1);
}

if (emulator) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  admin.initializeApp({ projectId: 'galway-museum-phone-booth' });
} else {
  const serviceAccountPath = resolve(__dirname, '../serviceAccountKey.json');
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  } catch {
    console.error(
      `Error: could not read ${serviceAccountPath}\n` +
      'Download it from Firebase console → Project Settings → Service accounts\n' +
      'Or run against the emulator: add --emulator'
    );
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function migrateCollection(collectionName) {
  const snapshot = await db.collection(collectionName).where('uid', '==', fromUid).get();

  if (snapshot.empty) {
    console.log(`  ${collectionName}: no documents found`);
    return 0;
  }

  console.log(`  ${collectionName}: found ${snapshot.size} document(s)`);

  const update = { uid: toUid };
  if (newName) update.submitterName = newName;

  if (dryRun) {
    snapshot.forEach(doc => console.log(`    [dry-run] would update ${collectionName}/${doc.id}`));
    return snapshot.size;
  }

  // Batch writes are capped at 500 ops; chunk if needed
  const BATCH_SIZE = 499;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i, i + BATCH_SIZE).forEach(doc => {
      batch.update(doc.ref, update);
      console.log(`    updating ${collectionName}/${doc.id}`);
    });
    await batch.commit();
  }

  return snapshot.size;
}

async function run() {
  const fields = ['uid', ...(newName ? ['submitterName'] : [])].join(', ');
  console.log(`Migrating ${fields}: ${fromUid} → ${toUid}${newName ? ` (name: "${newName}")` : ''}${dryRun ? ' [DRY RUN]' : ''}\n`);

  let total = 0;
  for (const col of ['submissions', 'curated_songs']) {
    total += await migrateCollection(col);
  }

  console.log(`\nDone. ${dryRun ? 'Would update' : 'Updated'} ${total} document(s).`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
