export async function up(knex) {
  const hasStars = await knex.schema.hasColumn('lieu_ratings', 'stars');
  if (!hasStars) return;

  await knex.schema.alterTable('lieu_ratings', (t) => {
    t.integer('value').nullable();
  });
  await knex('lieu_ratings').update({
    value: knex.raw('IF(stars >= 3, 1, -1)'),
  });
  await knex.schema.alterTable('lieu_ratings', (t) => {
    t.dropColumn('stars');
  });
  await knex.raw('ALTER TABLE lieu_ratings MODIFY value TINYINT NOT NULL');
}

export async function down(knex) {
  const hasValue = await knex.schema.hasColumn('lieu_ratings', 'value');
  if (!hasValue) return;

  await knex.schema.alterTable('lieu_ratings', (t) => {
    t.integer('stars').unsigned().nullable();
  });
  await knex('lieu_ratings').update({
    stars: knex.raw('IF(value = 1, 5, 1)'),
  });
  await knex.schema.alterTable('lieu_ratings', (t) => {
    t.dropColumn('value');
  });
  await knex.raw('ALTER TABLE lieu_ratings MODIFY stars INT UNSIGNED NOT NULL');
}
