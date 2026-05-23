/**
 * Lieux réels / notes terrain — Est de la France (Alsace, Bade, Vosges).
 * Idempotent : n'insère pas si le nom existe déjà.
 * Géocodage : POST /lieux/:id/geocode après import, ou script make geocode-est.
 */
const LIEUX_EST = [
  {
    nom: 'Restaurant M',
    adresse: 'Restaurant M, Alsace, France',
    ville: 'Alsace',
    type: 'blacklist',
    sono_imposee: true,
    commentaire: 'Sono imposée. Présence d\'un étage.',
  },
  {
    nom: "Salle d'Ingwiller",
    adresse: '67340 Ingwiller, Bas-Rhin, France',
    ville: 'Ingwiller',
    type: 'blacklist',
    commentaire: 'Noté « Salle d\'Insbourg » — lieu à confirmer.',
  },
  {
    nom: 'Drille au bord de l\'eau',
    adresse: 'Drusenheim, 67480, France',
    ville: 'Drusenheim',
    type: 'blacklist',
    sono_imposee: true,
    proprio_relou: true,
    commentaire: 'Au bord de l\'eau. Sono imposée, proprio difficile.',
  },
  {
    nom: 'Château de Pourtales',
    adresse: 'Château de Pourtales, 161 rue Mélanie, 67000 Strasbourg, France',
    ville: 'Strasbourg',
    type: 'blacklist',
    commentaire: 'Compresseur / sono contrainte.',
  },
  {
    nom: 'Elmerforst (chambre d\'hôtel)',
    adresse: 'Elmerforst, Alsace, France',
    type: 'blacklist',
    commentaire: 'Chambre d\'hôtel — contexte à préciser.',
  },
  {
    nom: 'Rebberg Hermitage',
    adresse: '68380 Urmatten, France',
    type: 'blacklist',
    proprio_relou: true,
    commentaire: 'Urmatten — catastrophe côté patronne.',
  },
  {
    nom: 'Château de Thanvillé',
    adresse: 'Château de Thanvillé, Alsace, France',
    type: 'blacklist',
    commentaire: 'Lieu à confirmer (orthographe / adresse exacte).',
  },
  {
    nom: 'Foyer Saint-Martin Ensisheim',
    adresse: 'Foyer Saint-Martin, Ensisheim, 68150, France',
    ville: 'Ensisheim',
    type: 'blacklist',
    db_limite: 80,
    fumee_interdite: true,
    commentaire: 'Limiteur 80 dB, pas de fumée.',
  },
  {
    nom: 'Vauthiermont',
    adresse: '68230 Vauthiermont, Haut-Rhin, France',
    type: 'blacklist',
    commentaire: 'Niveau sonore / dB : catastrophe.',
  },
  {
    nom: 'Jardin du Nideck',
    adresse: 'Château du Nideck, 67320 Ottrott, Bas-Rhin, France',
    ville: 'Ottrott',
    type: 'blacklist',
    db_limite: 85,
    commentaire: 'dB ~85–90 selon config, détecteurs, agent de sécurité requis.',
  },
  {
    nom: 'Holandsbourg',
    adresse: 'Haut-Koenigsbourg, 67600 Orschwiller, France',
    ville: 'Orschwiller',
    type: 'blacklist',
    acces_difficile: true,
    commentaire: 'Détecteurs, caméras, accès compliqué.',
  },
  {
    nom: 'Heimsbrunn',
    adresse: 'Heimsbrunn, 68990, France',
    ville: 'Heimsbrunn',
    type: 'blacklist',
    heure_fermeture: '01:00',
    commentaire: 'Attention : heure de fin 1h du matin.',
  },
  {
    nom: 'Cheval Noir Lampertheim',
    adresse: 'Cheval Noir, 68623 Lampertheim, Deutschland',
    ville: 'Lampertheim',
    type: 'blacklist',
    acces_difficile: true,
    commentaire: 'Accès et rangement difficiles.',
  },
  {
    nom: 'Côté lac',
    adresse: 'Côté lac, Alsace, France',
    type: 'blacklist',
    commentaire: 'Lieu à confirmer (nom / adresse exacts).',
  },
  {
    nom: 'Bollwiller (Bollengerb)',
    adresse: 'Bollwiller, 68500, France',
    ville: 'Bollwiller',
    type: 'favori',
    date_dernier_evenement: '2024-06-15',
    heure_fermeture: '01:00',
    commentaire:
      'Baisse de son vers 1h malgré chapiteau extérieur — ça passe. Retour positif juin 2024.',
  },
  {
    nom: 'Bellevue',
    adresse: 'Salle Bellevue, Haut-Rhin, Alsace, France',
    type: 'blacklist',
    heure_fermeture: '02:00',
    commentaire: 'Fin vers 2h du matin. Agent de sécurité requis.',
  },
  {
    nom: 'Gundolsheim',
    adresse: 'Gundolsheim, 68280, France',
    ville: 'Gundolsheim',
    type: 'blacklist',
    commentaire: 'Limiteur lié à la température / contraintes techniques.',
  },
  {
    nom: 'Chauffours-Saint-Martin',
    adresse: '88260 Chauffours-les-Bains, Vosges, France',
    ville: 'Chauffours-Saint-Martin',
    type: 'blacklist',
    acces_difficile: true,
    fumee_interdite: true,
    commentaire: 'Accès difficile, hauteur limitée, fumée interdite.',
  },
  {
    nom: 'Gertwiller',
    adresse: 'Gertwiller, 67690, France',
    ville: 'Gertwiller',
    type: 'blacklist',
    commentaire: 'Limiteur sonore strict.',
  },
  {
    nom: 'Domaine Saint-Loup',
    adresse: 'Domaine Saint-Loup, Soultzmatt, 68570, France',
    type: 'blacklist',
    commentaire: 'Limiteur imposé — très contraignant (à éviter selon notes).',
  },
  {
    nom: 'Hollandburg',
    adresse: 'Hohlandsbourg, 67600 Kintzheim, France',
    type: 'blacklist',
    acces_difficile: true,
    commentaire: 'Accès merdique (peut être proche Holandsbourg — à fusionner si doublon).',
  },
  {
    nom: 'Bergerie Le Maloubin',
    adresse: 'Le Maloubin, 68360 Orbey, France',
    ville: 'Orbey',
    type: 'blacklist',
    commentaire: 'Orbey — Lemaloubin.',
  },
  {
    nom: 'Logelheim',
    adresse: 'Logelheim, 68280, France',
    ville: 'Logelheim',
    type: 'blacklist',
    commentaire: 'Limiteur jugé abusif.',
  },
  {
    nom: 'CCA Châtenois',
    adresse: '4 Rue Saint-Georges, 67730 Châtenois, France',
    ville: 'Châtenois',
    type: 'blacklist',
    commentaire: 'CCA — Cercle catholique d\'action.',
  },
  {
    nom: 'Ostheim',
    adresse: 'Ostheim, 68190, France',
    ville: 'Ostheim',
    type: 'blacklist',
    db_limite: 83,
    commentaire: 'Limiteur 83 dB, contact fenêtre / voisinage.',
  },
  {
    nom: 'Châtenois — salle des ferrants',
    adresse: 'Salle des fêtes, 4 Rue Saint-Georges, 67730 Châtenois, France',
    ville: 'Châtenois',
    type: 'blacklist',
    commentaire: 'Noté « thiserrants » — contraintes décibel à vérifier.',
  },
];

export async function seed(knex) {
  const user = await knex('users').where({ email: 'demo@salles.local' }).first();
  if (!user) {
    console.warn('003_lieux_est : exécuter 001_users.js avant (compte demo absent).');
    return;
  }

  let inserted = 0;
  for (const row of LIEUX_EST) {
    const exists = await knex('lieux').where({ nom: row.nom }).first();
    if (exists) continue;
    await knex('lieux').insert({
      ...row,
      auteur_id: user.id,
      confetti_interdit: null,
    });
    inserted += 1;
  }
  console.log(`003_lieux_est : ${inserted} lieu(x) ajouté(s), ${LIEUX_EST.length - inserted} déjà présents.`);
}
