export async function up(knex) {
  await knex.schema.createTable('lieu_ratings', (t) => {
    t.increments('id').primary();
    t.integer('lieu_id').unsigned().notNullable().references('id').inTable('lieux').onDelete('CASCADE');
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('stars').unsigned().notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.unique(['lieu_id', 'user_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('lieu_ratings');
}
