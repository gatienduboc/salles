/** Corrige Châtenois (67) confondu avec Châtenois (88) dans le seed initial. */
export async function up(knex) {
  await knex('lieux')
    .where({ nom: 'CCA Châtenois' })
    .update({
      adresse: '4 Rue Saint-Georges, 67730 Châtenois, France',
      ville: 'Châtenois',
      code_postal: '67730',
      latitude: null,
      longitude: null,
      geocoded_at: null,
      geocode_error: null,
      updated_at: knex.fn.now(),
    });

  await knex('lieux')
    .where({ nom: 'Châtenois — salle des ferrants' })
    .update({
      adresse: 'Salle des fêtes, 4 Rue Saint-Georges, 67730 Châtenois, France',
      ville: 'Châtenois',
      code_postal: '67730',
      latitude: null,
      longitude: null,
      geocoded_at: null,
      geocode_error: null,
      updated_at: knex.fn.now(),
    });
}

export async function down(knex) {
  await knex('lieux')
    .where({ nom: 'CCA Châtenois' })
    .update({
      adresse: '88140 Châtenois, Vosges, France',
      code_postal: null,
      latitude: null,
      longitude: null,
      geocoded_at: null,
      updated_at: knex.fn.now(),
    });

  await knex('lieux')
    .where({ nom: 'Châtenois — salle des ferrants' })
    .update({
      adresse: 'Salle des fêtes, Châtenois, 88140, France',
      code_postal: null,
      latitude: null,
      longitude: null,
      geocoded_at: null,
      updated_at: knex.fn.now(),
    });
}
