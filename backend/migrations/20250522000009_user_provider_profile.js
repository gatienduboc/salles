const ACTIVITIES = [
  'dj',
  'traiteur',
  'wedding_planner',
  'photographe',
  'fleuriste',
  'animation',
  'sonorisation',
  'lieu',
  'autre',
];

export async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.enum('activity', ACTIVITIES).notNullable().defaultTo('autre');
    t.string('city', 100).notNullable().defaultTo('');
    t.string('postal_code', 10).nullable();
    t.string('company_name', 150).nullable();
    t.string('siret', 14).nullable();
    t.string('phone', 20).nullable();
    t.string('website_url', 255).nullable();
    t.text('bio').nullable();
    t.integer('intervention_radius_km').unsigned().nullable();
    t.boolean('has_rc_pro').nullable();
    t.timestamp('profile_updated_at').nullable();
  });

  await knex('users').where('city', '').update({ city: 'Non renseignée' });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('profile_updated_at');
    t.dropColumn('has_rc_pro');
    t.dropColumn('intervention_radius_km');
    t.dropColumn('bio');
    t.dropColumn('website_url');
    t.dropColumn('phone');
    t.dropColumn('siret');
    t.dropColumn('company_name');
    t.dropColumn('postal_code');
    t.dropColumn('city');
    t.dropColumn('activity');
  });
}
