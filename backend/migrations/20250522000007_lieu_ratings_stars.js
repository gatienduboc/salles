export async function up(knex) {
  const hasStars = await knex.schema.hasColumn('lieu_ratings', 'stars');
  if (hasStars) return;

  await knex.schema.alterTable('lieu_ratings', (t) => {
    t.integer('stars').unsigned().nullable();
  });
  await knex('lieu_ratings').update({ stars: 3 });
  await knex.raw('ALTER TABLE lieu_ratings MODIFY stars INT UNSIGNED NOT NULL');
}

export async function down(knex) {
  if (await knex.schema.hasColumn('lieu_ratings', 'stars')) {
    await knex.schema.alterTable('lieu_ratings', (t) => {
      t.dropColumn('stars');
    });
  }
}
