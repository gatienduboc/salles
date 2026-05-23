export async function up(knex) {
  await knex.schema.alterTable('lieux', (t) => {
    t.string('google_maps_url', 512).nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('lieux', (t) => {
    t.dropColumn('google_maps_url');
  });
}
