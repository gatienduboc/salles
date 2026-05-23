/**
 * Re-géocode tous les lieux (nom + adresse).
 * Google Maps si GOOGLE_MAPS_API_KEY est défini, sinon Nominatim.
 *
 * Usage :
 *   node scripts/geocode-all.js          # seulement sans coords ou en erreur
 *   node scripts/geocode-all.js --force  # tous les lieux
 */
import 'dotenv/config';
import { db } from '../src/db/knex.js';
import { config } from '../src/config/index.js';
import { geocodeLieu } from '../src/services/geocoding.js';

const force = process.argv.includes('--force');
const delayMs = config.googleMaps.apiKey
  ? config.googleMaps.minIntervalMs
  : config.nominatim.minIntervalMs;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  let q = db('lieux').select('id', 'nom', 'adresse').orderBy('id', 'asc');
  if (!force) {
    q = q.where((b) => {
      b.whereNull('latitude').orWhereNull('longitude').orWhereNotNull('geocode_error');
    });
  }

  const rows = await q;
  if (!rows.length) {
    console.log('Aucun lieu à géocoder.');
    await db.destroy();
    return;
  }

  const provider = config.googleMaps.apiKey ? 'Google Maps' : 'Nominatim (nom + adresse)';
  console.log(`${rows.length} lieu(x) — ${provider}${force ? ' [force]' : ''}…`);

  let ok = 0;
  let fail = 0;

  for (const lieu of rows) {
    try {
      const result = await geocodeLieu(lieu.nom, lieu.adresse, { force: true });
      if (result.error) {
        await db('lieux').where({ id: lieu.id }).update({
          geocode_error: result.error,
          geocoded_at: null,
          google_place_id: null,
          google_maps_url: null,
          updated_at: db.fn.now(),
        });
        console.warn(`✗ ${lieu.nom} : ${result.error}`);
        fail += 1;
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
        const where = [result.ville, result.code_postal].filter(Boolean).join(' ');
        const gPlace = result.google_place_id ? ' [Google]' : '';
        console.log(
          `✓ ${lieu.nom} → ${where || `${result.latitude}, ${result.longitude}`}${gPlace}`
        );
        ok += 1;
      }
    } catch (err) {
      console.warn(`✗ ${lieu.nom} : ${err.message}`);
      fail += 1;
    }
    await sleep(delayMs);
  }

  console.log(`Terminé : ${ok} ok, ${fail} échec(s).`);
  await db.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
