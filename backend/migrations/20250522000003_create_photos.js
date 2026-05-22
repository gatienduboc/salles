export async function up(knex) {
  await knex.schema.createTable('photos', (t) => {
    t.increments('id').primary();
    t.integer('lieu_id').unsigned().notNullable().references('id').inTable('lieux').onDelete('CASCADE');
    t.string('filename', 255).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('photos');
}
