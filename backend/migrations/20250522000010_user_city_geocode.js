export async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.decimal('city_latitude', 10, 7).nullable();
    t.decimal('city_longitude', 10, 7).nullable();
    t.timestamp('city_geocoded_at').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('city_geocoded_at');
    t.dropColumn('city_longitude');
    t.dropColumn('city_latitude');
  });
}
