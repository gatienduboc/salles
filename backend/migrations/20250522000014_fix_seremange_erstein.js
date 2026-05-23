/** Adresse erronée (57390) + mauvais établissement Google (Salle Rio). */
export async function up(knex) {
  await knex('lieux')
    .where({ nom: 'Salle de Serémange-Erstein' })
    .update({
      adresse: 'Salle des fêtes, 9 Rue Charles de Gaulle, 57290 Serémange-Erzange, France',
      ville: 'Serémange-Erzange',
      code_postal: '57290',
      latitude: null,
      longitude: null,
      google_place_id: null,
      google_maps_url: null,
      geocoded_at: null,
      geocode_error: null,
      updated_at: knex.fn.now(),
    });
}

export async function down(knex) {
  await knex('lieux')
    .where({ nom: 'Salle de Serémange-Erstein' })
    .update({
      adresse: '57390 Serémange-Erstein, Moselle, France',
      updated_at: knex.fn.now(),
    });
}
