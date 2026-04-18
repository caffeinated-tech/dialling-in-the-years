#!/usr/bin/env node
/**
 * seed-emulator.js
 *
 * Seeds the `curated_songs` collection in the local Firestore emulator with
 * the real song data from arduino/dialling_in_the_years.ino (1955–2000).
 *
 * The emulator must be running first:
 *   npm run emulators
 *
 * Usage:
 *   npm run seed-emulator
 */

import admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({ projectId: 'galway-museum-phone-booth' });

const db = admin.firestore();

// Song data sourced directly from arduino/dialling_in_the_years.ino.
// Format in the .ino file is "Title - Artist"; parsed accordingly here.
const songs = [
  { year: 1955, title: 'Rock Around the Clock',              artist: 'Bill Haley & the Comets' },
  { year: 1956, title: 'Heartbreak Hotel',                   artist: 'Elvis Presley' },
  { year: 1957, title: 'At the Hop',                         artist: 'Danny and the Juniors' },
  { year: 1958, title: 'Heartbreak', artist: 'Buddy Holly' },
  { year: 1959, title: 'Donna',                              artist: 'Ritchie Valens' },
  { year: 1960, title: 'Will You Love Me Tomorrow',          artist: 'The Shirelles' },
  { year: 1961, title: 'Poetry in Motion',                   artist: 'Johnny Tillotson' },
  { year: 1962, title: 'Save the Last Dance for Me',         artist: 'The Drifters' },
  { year: 1963, title: 'She Loves You',                      artist: 'The Beatles' },
  { year: 1964, title: 'Downtown',                           artist: 'Petula Clark' },
  { year: 1965, title: 'I Got You Babe',                     artist: 'Sonny & Cher' },
  { year: 1966, title: 'Good Vibrations',                    artist: 'The Beach Boys' },
  { year: 1967, title: 'Black Velvet Band',                  artist: 'The Dubliners' },
  { year: 1968, title: 'Those Were the Days',                artist: 'Mary Hopkin' },
  { year: 1969, title: 'Bad Moon Rising',                    artist: 'Creedence Clearwater Revival' },
  { year: 1970, title: 'Woodstock',                          artist: 'Matthews Southern Comfort' },
  { year: 1971, title: 'Sweet Caroline',                     artist: 'Neil Diamond' },
  { year: 1972, title: 'Telegram Sam / Metal Guru',          artist: 'T. Rex' },
  { year: 1973, title: 'Whiskey in the Jar',                 artist: 'Thin Lizzy' },
  { year: 1974, title: 'Waterloo',                           artist: 'ABBA' },
  { year: 1975, title: 'Harvest for the World',              artist: 'The Isley Brothers' },
  { year: 1976, title: "I Don't Want to Talk About It",      artist: 'Rod Stewart' },
  { year: 1977, title: 'Stayin\' Alive',                     artist: 'Bee Gees' },
  { year: 1978, title: 'YMCA',                               artist: 'Village People' },
  { year: 1979, title: 'I Will Survive',                     artist: 'Gloria Gaynor' },
  { year: 1980, title: 'Could You Be Loved',                 artist: 'Bob Marley' },
  { year: 1981, title: 'Kids in America',                    artist: 'Kim Wilde' },
  { year: 1982, title: "Theme from Harry's Game",            artist: 'Clannad' },
  { year: 1983, title: 'Flashdance... What a Feeling',       artist: 'Irene Cara' },
  { year: 1984, title: '99 Red Balloons',                    artist: 'Nena' },
  { year: 1985, title: 'In a Lifetime',                      artist: 'Clannad & Bono' },
  { year: 1986, title: 'A Good Heart',                       artist: 'Fergal Sharkey' },
  { year: 1987, title: 'With or Without You',                artist: 'U2' },
  { year: 1988, title: 'Perfect',                            artist: 'Fairground Attraction' },
  { year: 1989, title: 'Love Shack',                         artist: 'The B-52s' },
  { year: 1990, title: 'Put \'Em Under Pressure',             artist: 'Republic of Ireland Football Squad' },
  { year: 1991, title: 'Brewing Up a Storm',                 artist: 'The Stunning' },
  { year: 1992, title: "It's My Life",                       artist: 'Dr. Alban' },
  { year: 1993, title: 'Mr. Vain',                           artist: 'Culture Beat' },
  { year: 1994, title: 'Circle of Life',                     artist: 'Elton John' },
  { year: 1995, title: 'The Foggy Dew',                      artist: "The Chieftains & Sinéad O'Connor" },
  { year: 1996, title: 'Walk On By',                         artist: 'Gabrielle' },
  { year: 1997, title: 'Freed from Desire',                  artist: 'Gala' },
  { year: 1998, title: 'Brimful of Asha (Norman Cook Remix)', artist: 'Cornershop' },
  { year: 1999, title: 'Praise You',                         artist: 'Fatboy Slim' },
  { year: 2000, title: "Groovejet (If This Ain't Love)",     artist: 'Spiller feat. Sophie Ellis-Bextor' },
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
  console.log(`Seeded ${songs.length} curated songs into the emulator.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
