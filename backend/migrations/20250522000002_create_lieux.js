export async function up(knex) {
  await knex.schema.createTable('lieux', (t) => {
    t.increments('id').primary();
    t.string('nom', 255).notNullable();
    t.string('adresse', 500).notNullable();
    t.string('nom_gerant', 255).nullable();
    t.string('telephone', 50).nullable();
    t.boolean('fumee_interdite').nullable();
    t.boolean('confetti_interdit').nullable();
    t.integer('db_limite').unsigned().nullable();
    t.boolean('acces_difficile').nullable();
    t.boolean('proprio_relou').nullable();
    t.text('commentaire').nullable();
    t.string('heure_fermeture', 50).nullable();
    t.boolean('sono_imposee').nullable();
    t.integer('auteur_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.date('date_dernier_evenement').nullable();
    t.enum('type', ['blacklist', 'favori']).notNullable().defaultTo('blacklist');
    t.decimal('latitude', 10, 8).nullable();
    t.decimal('longitude', 11, 8).nullable();
    t.string('ville', 255).nullable();
    t.string('code_postal', 20).nullable();
    t.timestamp('geocoded_at').nullable();
    t.string('geocode_error', 500).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.index(['type', 'ville']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('lieux');
}
