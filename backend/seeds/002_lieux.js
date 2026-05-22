export async function seed(knex) {
  const user = await knex('users').where({ email: 'demo@salles.local' }).first();
  if (!user) return;

  await knex('lieux').insert([
    {
      nom: 'Salle des Fêtes Test',
      adresse: '10 rue de la Paix, 75002 Paris, France',
      type: 'blacklist',
      auteur_id: user.id,
      commentaire: 'Exemple à éviter — bruit, accès compliqué',
      acces_difficile: true,
      ville: 'Paris',
      latitude: 48.8698,
      longitude: 2.3314,
      geocoded_at: knex.fn.now(),
    },
    {
      nom: 'Domaine de la Vallée',
      adresse: '12 chemin des Vignes, 69001 Lyon, France',
      type: 'favori',
      auteur_id: user.id,
      commentaire: 'Très bon accueil, sono correcte',
      db_limite: 100,
      ville: 'Lyon',
      latitude: 45.764,
      longitude: 4.8357,
      geocoded_at: knex.fn.now(),
    },
  ]);
}
