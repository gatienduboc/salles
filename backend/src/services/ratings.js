export const RATING_BASELINE = 5;
export const RATING_MIN = 0;
export const RATING_MAX = 10;

const EMPTY_RATING = {
  average: RATING_BASELINE,
  count: 0,
  user_stars: null,
  below_base: 0,
  above_base: 0,
  at_base: 0,
};

function roundAvg(avg) {
  if (avg == null || Number.isNaN(avg)) return RATING_BASELINE;
  return Math.round(Number(avg) * 10) / 10;
}

function valueFromStars(stars) {
  if (stars > RATING_BASELINE) return 1;
  if (stars < RATING_BASELINE) return -1;
  return 0;
}

export async function getRatingAggregates(knexDb, lieuIds, userId = null) {
  if (!lieuIds.length) return {};

  const rows = await knexDb('lieu_ratings').whereIn('lieu_id', lieuIds).select('lieu_id', 'stars');

  const map = {};
  for (const id of lieuIds) {
    map[id] = { ...EMPTY_RATING };
  }

  const byLieu = {};
  for (const r of rows) {
    if (!byLieu[r.lieu_id]) byLieu[r.lieu_id] = [];
    byLieu[r.lieu_id].push(r.stars);
  }

  for (const [id, starsList] of Object.entries(byLieu)) {
    const lid = Number(id);
    const count = starsList.length;
    const sum = starsList.reduce((a, b) => a + b, 0);
    map[lid] = {
      average: roundAvg(sum / count),
      count,
      user_stars: null,
      below_base: starsList.filter((s) => s < RATING_BASELINE).length,
      above_base: starsList.filter((s) => s > RATING_BASELINE).length,
      at_base: starsList.filter((s) => s === RATING_BASELINE).length,
    };
  }

  if (userId) {
    const userRows = await knexDb('lieu_ratings')
      .whereIn('lieu_id', lieuIds)
      .where({ user_id: userId })
      .select('lieu_id', 'stars');
    for (const r of userRows) {
      if (map[r.lieu_id]) map[r.lieu_id].user_stars = r.stars;
    }
  }

  return map;
}

export function attachRatings(lieux, ratingMap) {
  return lieux.map((l) => ({
    ...l,
    rating: { baseline: RATING_BASELINE, ...(ratingMap[l.id] || { ...EMPTY_RATING }) },
  }));
}

export async function upsertLieuRating(knexDb, lieuId, userId, stars) {
  const starCount = parseInt(stars, 10);
  if (starCount < RATING_MIN || starCount > RATING_MAX) {
    const err = new Error(`stars doit être entre ${RATING_MIN} et ${RATING_MAX}`);
    err.status = 400;
    throw err;
  }

  const value = valueFromStars(starCount);
  const existing = await knexDb('lieu_ratings')
    .where({ lieu_id: lieuId, user_id: userId })
    .first();

  if (existing) {
    await knexDb('lieu_ratings')
      .where({ id: existing.id })
      .update({ stars: starCount, value, updated_at: knexDb.fn.now() });
  } else {
    await knexDb('lieu_ratings').insert({
      lieu_id: lieuId,
      user_id: userId,
      stars: starCount,
      value,
    });
  }

  const map = await getRatingAggregates(knexDb, [lieuId], userId);
  return map[lieuId];
}
