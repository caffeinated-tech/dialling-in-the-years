#!/usr/bin/env node
/**
 * grant-admin.js
 *
 * Sets the `admin: true` custom claim on a Firebase Auth user.
 * Run this once to bootstrap the first curator account, then again
 * whenever a new admin needs to be added or removed.
 *
 * Usage:
 *   node scripts/grant-admin.js <email> [--revoke] [--emulator]
 *
 * Examples:
 *   # Against production (requires scripts/serviceAccountKey.json):
 *   node scripts/grant-admin.js curator@museum.ie
 *   node scripts/grant-admin.js curator@museum.ie --revoke
 *
 *   # Against local emulators (no service account needed):
 *   node scripts/grant-admin.js curator@museum.ie --emulator
 *
 * Production prerequisites:
 *   Download a service account key from Firebase console:
 *   Project Settings → Service accounts → Generate new private key
 *   Save it as scripts/serviceAccountKey.json (never commit this file)
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const email = process.argv[2];
const revoke = process.argv.includes('--revoke');
const emulator = process.argv.includes('--emulator');

if (!email) {
  console.error('Usage: node scripts/grant-admin.js <email> [--revoke] [--emulator]');
  process.exit(1);
}

if (emulator) {
  // Must be set before initializeApp() for the Admin SDK to use the emulator
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  admin.initializeApp({ projectId: 'galway-museum-phone-booth' });
} else {
  const serviceAccountPath = resolve(__dirname, 'serviceAccountKey.json');
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  } catch {
    console.error(
      `Error: could not read ${serviceAccountPath}\n` +
      'Download it from Firebase console → Project Settings → Service accounts\n' +
      'Or run against the emulator: node scripts/grant-admin.js <email> --emulator'
    );
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

async function run() {
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch {
    console.error(`No Firebase Auth user found with email: ${email}`);
    console.error('The user must sign in at least once before you can grant admin.');
    process.exit(1);
  }

  const claims = revoke ? {} : { admin: true };
  await admin.auth().setCustomUserClaims(user.uid, claims);

  const action = revoke ? 'Revoked admin from' : 'Granted admin to';
  console.log(`${action} ${email} (uid: ${user.uid})`);
  if (!emulator) console.log('The user must sign out and back in for the claim to take effect.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
