import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/app.js';
import { resetDatabase, closeDatabase, testDb } from '../helpers/db.js';
import { createUser, createLieu } from '../helpers/factory.js';

describe('Lieux API', () => {
  let app;

  beforeAll(async () => {
    await resetDatabase();
    app = await getTestApp();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('GET /lieux public sans JWT', async () => {
    const { user } = await createUser();
    await createLieu(user.id, { nom: 'Salle Publique', ville: 'Paris' });

    const res = await request(app).get('/lieux');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('counts');
    expect(res.body.data[0]).toHaveProperty('auteur');
  });

  it('tri nom asc et meta pagination', async () => {
    const { user } = await createUser();
    await createLieu(user.id, { nom: 'Zebra', type: 'blacklist', adresse: 'Z' });
    await createLieu(user.id, { nom: 'Alpha', type: 'blacklist', adresse: 'A' });

    const res = await request(app)
      .get('/lieux')
      .query({ sort: 'nom', order: 'asc', limit: 2, page: 1 });

    expect(res.status).toBe(200);
    expect(res.body.meta.sort).toBe('nom');
    expect(res.body.meta.order).toBe('asc');
    expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].nom).toBe('Alpha');
  });

  it('filtre par auteur_id et GET /lieux/auteurs', async () => {
    const { user: u1 } = await createUser({ pseudo: 'DJ Alpha' });
    const { user: u2 } = await createUser({ email: 'b@test.local', pseudo: 'DJ Beta' });
    await createLieu(u1.id, { nom: 'Salle A', adresse: '1 rue A' });
    await createLieu(u1.id, { nom: 'Salle B', adresse: '2 rue B' });
    await createLieu(u2.id, { nom: 'Salle C', adresse: '3 rue C' });

    const auteurs = await request(app).get('/lieux/auteurs');
    expect(auteurs.status).toBe(200);
    const alpha = auteurs.body.data.find((a) => a.pseudo === 'DJ Alpha');
    const beta = auteurs.body.data.find((a) => a.pseudo === 'DJ Beta');
    expect(alpha?.count).toBe(2);
    expect(beta?.count).toBe(1);

    const filtered = await request(app).get('/lieux').query({ auteur_id: u2.id });
    expect(filtered.body.data.some((l) => l.nom === 'Salle C')).toBe(true);
    expect(filtered.body.data.every((l) => l.auteur.pseudo === 'DJ Beta')).toBe(true);
  });

  it('GET /lieux/map retourne les coords filtrées', async () => {
    const { user } = await createUser();
    await createLieu(user.id, {
      nom: 'MapOk',
      type: 'favori',
      adresse: 'Lyon',
      latitude: 45.75,
      longitude: 4.85,
    });
    await createLieu(user.id, {
      nom: 'SansCoords',
      type: 'favori',
      adresse: 'X',
      latitude: null,
      longitude: null,
    });

    const res = await request(app).get('/lieux/map').query({ type: 'favori' });
    expect(res.status).toBe(200);
    expect(res.body.data.every((l) => l.latitude != null)).toBe(true);
    expect(res.body.data.some((l) => l.nom === 'MapOk')).toBe(true);
    expect(res.body.data.some((l) => l.nom === 'SansCoords')).toBe(false);
  });

  it('GET /lieux/map inclut aperçu (adresse, commentaire, photo, note)', async () => {
    const { user, token } = await createUser();
    const lieu = await createLieu(user.id, {
      nom: 'PreviewMap',
      type: 'favori',
      adresse: '10 rue Aperçu',
      commentaire: 'Super salle pour danser',
      latitude: 48.1,
      longitude: 7.2,
    });
    await testDb('photos').insert({ lieu_id: lieu.id, filename: 'preview.jpg' });
    await testDb('lieu_ratings').insert({
      lieu_id: lieu.id,
      user_id: user.id,
      stars: 8,
      value: 1,
    });

    const res = await request(app)
      .get('/lieux/map')
      .query({ search: 'PreviewMap' })
      .set('Authorization', `Bearer ${token}`);
    const row = res.body.data.find((l) => l.nom === 'PreviewMap');
    expect(row.adresse).toBe('10 rue Aperçu');
    expect(row.commentaire).toContain('Super salle');
    expect(row.photo_url).toContain('preview.jpg');
    expect(row.rating.average).toBe(8);
    expect(row.rating.user_stars).toBe(8);
  });

  it('filtre type favori et meta.counts', async () => {
    const { user } = await createUser();
    await createLieu(user.id, { nom: 'Mauvais', type: 'blacklist', adresse: 'A' });
    await createLieu(user.id, { nom: 'Bon', type: 'favori', adresse: 'B' });

    const res = await request(app).get('/lieux').query({ type: 'favori' });
    expect(res.status).toBe(200);
    expect(res.body.data.every((l) => l.type === 'favori')).toBe(true);
    expect(res.body.meta.counts.favori).toBeGreaterThanOrEqual(1);
  });

  it('filtre ville et search', async () => {
    const { user } = await createUser();
    await createLieu(user.id, { nom: 'Alpha', ville: 'Marseille', adresse: 'Marseille' });
    await createLieu(user.id, { nom: 'Beta', ville: 'Paris', adresse: 'Paris centre' });

    const byVille = await request(app).get('/lieux').query({ ville: 'Marseille' });
    expect(byVille.body.data.every((l) => l.ville?.includes('Marseille'))).toBe(true);

    const bySearch = await request(app).get('/lieux').query({ search: 'Beta' });
    expect(bySearch.body.data.some((l) => l.nom === 'Beta')).toBe(true);
  });

  it('POST sans token → 401', async () => {
    const res = await request(app)
      .post('/lieux')
      .send({ nom: 'X', adresse: 'Y' });
    expect(res.status).toBe(401);
  });

  it('CRUD avec JWT', async () => {
    const { token } = await createUser();

    const created = await request(app)
      .post('/lieux')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Nouvelle salle',
        adresse: '5 rue Test, 69001 Lyon, France',
      });

    expect(created.status).toBe(201);
    expect(created.body.auteur).toHaveProperty('pseudo');
    const id = created.body.id;

    const updated = await request(app)
      .put(`/lieux/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ commentaire: 'Mise à jour' });

    expect(updated.status).toBe(200);
    expect(updated.body.commentaire).toBe('Mise à jour');

    const deleted = await request(app)
      .delete(`/lieux/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.status).toBe(204);
  });
});
