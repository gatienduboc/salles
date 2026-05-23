export async function up(knex) {
  await knex.schema.alterTable('lieux', (t) => {
    t.string('google_place_id', 255).nullable();
    t.index(['google_place_id']);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('lieux', (t) => {
    t.dropIndex(['google_place_id']);
    t.dropColumn('google_place_id');
  });
}
