import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/app.js';
import { resetDatabase, closeDatabase } from '../helpers/db.js';
import { createUser, createLieu } from '../helpers/factory.js';
import { config } from '../../src/config/index.js';

describe('Admin API', () => {
  let app;
  let adminToken;

  beforeAll(async () => {
    await resetDatabase();
    app = await getTestApp();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('403 pour utilisateur non admin', async () => {
    const { token } = await createUser();
    const res = await request(app).get('/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('GET /admin/stats et liste users pour admin', async () => {
    const { user, token } = await createUser({
      email: config.adminEmail,
      role: 'admin',
    });
    adminToken = token;
    await createLieu(user.id, { nom: 'AdminLieu' });

    const stats = await request(app).get('/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(stats.status).toBe(200);
    expect(stats.body.lieux.total).toBeGreaterThanOrEqual(1);

    const users = await request(app).get('/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(users.status).toBe(200);
    expect(users.body.data.some((u) => u.email === config.adminEmail)).toBe(true);
  });

  it('bulk patch auteur_id et bulk delete', async () => {
    const { user: admin, token } = await createUser({
      email: 'admin-bulk@test.local',
      role: 'admin',
    });
    const { user: dj } = await createUser({ email: 'dj@test.local', pseudo: 'DJ Test' });
    const l1 = await createLieu(admin.id, { nom: 'Bulk1', adresse: 'A' });
    const l2 = await createLieu(admin.id, { nom: 'Bulk2', adresse: 'B' });

    const patch = await request(app)
      .patch('/admin/lieux/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [l1.id, l2.id], patch: { auteur_id: dj.id, type: 'favori' } });
    expect(patch.status).toBe(200);
    expect(patch.body.updated).toBe(2);

    const list = await request(app)
      .get('/lieux')
      .query({ auteur_id: dj.id, type: 'favori' });
    expect(list.body.data.length).toBeGreaterThanOrEqual(2);

    const del = await request(app)
      .delete('/admin/lieux/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [l1.id, l2.id] });
    expect(del.status).toBe(200);
    expect(del.body.deleted).toBe(2);
  });

  it('DELETE user: 409 si lieux, 400 si compte admin principal', async () => {
    const { user: dj } = await createUser({ email: 'dj-del@test.local', pseudo: 'DJ Del' });
    await createLieu(dj.id, { nom: 'Garde', adresse: 'Z' });

    const res409 = await request(app)
      .delete(`/admin/users/${dj.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res409.status).toBe(409);

    const target = await request(app).get('/admin/users').set('Authorization', `Bearer ${adminToken}`);
    const adminRow = target.body.data.find((u) => u.email === config.adminEmail);
    const res400 = await request(app)
      .delete(`/admin/users/${adminRow.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res400.status).toBe(400);
  });
});
