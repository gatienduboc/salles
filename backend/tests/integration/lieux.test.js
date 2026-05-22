import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/app.js';
import { resetDatabase, closeDatabase } from '../helpers/db.js';
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
