import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/app.js';
import { resetDatabase, closeDatabase } from '../helpers/db.js';
import { createUser, createLieu } from '../helpers/factory.js';
import { RATING_BASELINE } from '../../src/services/ratings.js';

describe('Lieux ratings', () => {
  let app;

  beforeAll(async () => {
    await resetDatabase();
    app = await getTestApp();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('sans vote la moyenne affichée est 5 (base)', async () => {
    const { user } = await createUser({ email: 'base@test.local' });
    const lieu = await createLieu(user.id, { nom: 'Base', adresse: 'X' });
    const res = await request(app).get(`/lieux/${lieu.id}`);
    expect(res.body.rating.average).toBe(RATING_BASELINE);
    expect(res.body.rating.count).toBe(0);
  });

  it('vote 0–10 et moyenne', async () => {
    const { user: u1, token: t1 } = await createUser({ pseudo: 'Voter1' });
    const { token: t2 } = await createUser({ email: 'v2@test.local', pseudo: 'Voter2' });
    const lieu = await createLieu(u1.id, { nom: 'Salle Vote', adresse: 'X' });

    await request(app)
      .put(`/lieux/${lieu.id}/rating`)
      .set('Authorization', `Bearer ${t1}`)
      .send({ stars: 8 });
    await request(app)
      .put(`/lieux/${lieu.id}/rating`)
      .set('Authorization', `Bearer ${t2}`)
      .send({ stars: 2 });

    const detail = await request(app)
      .get(`/lieux/${lieu.id}`)
      .set('Authorization', `Bearer ${t1}`);
    expect(detail.body.rating.average).toBe(5);
    expect(detail.body.rating.count).toBe(2);
    expect(detail.body.rating.user_stars).toBe(8);
    expect(detail.body.rating.above_base).toBe(1);
    expect(detail.body.rating.below_base).toBe(1);
  });

  it('liste /lieux inclut rating', async () => {
    const { user, token } = await createUser({ email: 'list-r@test.local' });
    const lieu = await createLieu(user.id, { nom: 'RatedList', adresse: 'Z' });
    await request(app)
      .put(`/lieux/${lieu.id}/rating`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stars: 10 });

    const list = await request(app)
      .get('/lieux')
      .query({ search: 'RatedList' })
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.data[0].rating.average).toBe(10);
    expect(list.body.data[0].rating.user_stars).toBe(10);
  });

  it('PUT sans token → 401', async () => {
    const { user } = await createUser({ email: 'noauth-r@test.local' });
    const lieu = await createLieu(user.id, { nom: 'NoAuth', adresse: 'A' });
    const res = await request(app).put(`/lieux/${lieu.id}/rating`).send({ stars: 5 });
    expect(res.status).toBe(401);
  });

  it('stars invalides → 400', async () => {
    const { user, token } = await createUser({ email: 'bad-v@test.local' });
    const lieu = await createLieu(user.id, { nom: 'Bad', adresse: 'B' });
    const res = await request(app)
      .put(`/lieux/${lieu.id}/rating`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stars: 11 });
    expect(res.status).toBe(400);
  });
});
