const BASE = 5;

/** Passe les notes sur l’échelle 0–10 (5 = neutre). */
export async function up(knex) {
  const rows = await knex('lieu_ratings').select('id', 'value', 'stars');
  for (const row of rows) {
    let newStars = BASE;
    if (row.value === 1) newStars = Math.min(10, (row.stars || 3) + 5);
    else if (row.value === -1) newStars = Math.max(0, BASE - (row.stars || 3));
    else newStars = row.stars ?? BASE;
    await knex('lieu_ratings').where({ id: row.id }).update({
      stars: newStars,
      value: newStars > BASE ? 1 : newStars < BASE ? -1 : 0,
    });
  }
}

export async function down(knex) {
  const rows = await knex('lieu_ratings').select('id', 'stars');
  for (const row of rows) {
    const s = row.stars;
    let value = 0;
    let stars = 3;
    if (s > BASE) {
      value = 1;
      stars = Math.min(5, s - BASE);
    } else if (s < BASE) {
      value = -1;
      stars = Math.min(5, BASE - s);
    }
    await knex('lieu_ratings').where({ id: row.id }).update({ value, stars });
  }
}
