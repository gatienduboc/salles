export async function seed(knex) {
  const user = await knex('users').where({ email: 'demo@salles.local' }).first();
  if (!user) return;

  await knex('lieux').insert({
    nom: 'Salle des Fêtes Test',
    adresse: '10 rue de la Paix, 75002 Paris, France',
    type: 'blacklist',
    auteur_id: user.id,
    commentaire: 'Exemple seed — géocodage au premier PUT si besoin',
    ville: 'Paris',
    latitude: 48.8698,
    longitude: 2.3314,
    geocoded_at: knex.fn.now(),
  });
}
