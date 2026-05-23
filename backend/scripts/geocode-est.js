/**
 * Géocode les lieux importés sans coordonnées (seed 003).
 * Usage : node scripts/geocode-est.js
 * Respecte Nominatim : 1 req / 1.1s
 */
import 'dotenv/config';
import { db } from '../src/db/knex.js';
import { geocodeLieu } from '../src/services/geocoding.js';

const DELAY_MS = 1100;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const rows = await db('lieux')
    .whereNull('latitude')
    .orderBy('id', 'asc')
    .select('id', 'nom', 'adresse');

  if (!rows.length) {
    console.log('Aucun lieu sans coordonnées.');
    await db.destroy();
    return;
  }

  console.log(`${rows.length} lieu(x) à géocoder…`);
  for (const lieu of rows) {
    try {
      const result = await geocodeLieu(lieu.nom, lieu.adresse);
      if (result.error) {
        await db('lieux').where({ id: lieu.id }).update({
          geocode_error: result.error,
          updated_at: db.fn.now(),
        });
        console.warn(`✗ ${lieu.nom} : ${result.error}`);
      } else {
        await db('lieux').where({ id: lieu.id }).update({
          latitude: result.latitude,
          longitude: result.longitude,
          ville: result.ville ?? null,
          code_postal: result.code_postal ?? null,
          google_place_id: result.google_place_id ?? null,
          google_maps_url: result.google_maps_url ?? null,
          geocoded_at: db.fn.now(),
          geocode_error: null,
          updated_at: db.fn.now(),
        });
        console.log(`✓ ${lieu.nom} → ${result.ville ?? `${result.latitude},${result.longitude}`}`);
      }
    } catch (err) {
      console.warn(`✗ ${lieu.nom} : ${err.message}`);
    }
    await sleep(DELAY_MS);
  }
  await db.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
