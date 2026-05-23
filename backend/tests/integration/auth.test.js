import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/app.js';
import { resetDatabase, closeDatabase } from '../helpers/db.js';

const registerBody = (overrides = {}) => ({
  email: `user-${Date.now()}@test.local`,
  password: 'password123',
  pseudo: 'TestUser',
  activity: 'dj',
  city: 'Lyon',
  ...overrides,
});

describe('Auth API', () => {
  let app;

  beforeAll(async () => {
    await resetDatabase();
    app = await getTestApp();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('register puis login', async () => {
    const email = `dj-${Date.now()}@test.local`;

    const reg = await request(app)
      .post('/auth/register')
      .send(registerBody({ email, pseudo: 'TestUser' }));

    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeDefined();
    expect(reg.body.user.pseudo).toBe('TestUser');

    const login = await request(app)
      .post('/auth/login')
      .send({ email, password: 'password123' });

    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();
  });

  it('email dupliqué → 409', async () => {
    const email = `dup-${Date.now()}@test.local`;
    await request(app).post('/auth/register').send(registerBody({ email, pseudo: 'UserA' }));

    const res = await request(app).post('/auth/register').send(registerBody({ email, pseudo: 'UserB' }));

    expect(res.status).toBe(409);
  });

  it('logout → 204', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(204);
  });

  it('PATCH /auth/profile met à jour le pseudo', async () => {
    const email = `prof-${Date.now()}@test.local`;
    const reg = await request(app)
      .post('/auth/register')
      .send(registerBody({ email, pseudo: 'Ancien' }));
    const token = reg.body.token;

    const res = await request(app)
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ pseudo: 'Nouveau Pseudo' });
    expect(res.status).toBe(200);
    expect(res.body.pseudo).toBe('Nouveau Pseudo');
    expect(res.body.email).toBe(email);
    expect(res.body.token).toBeDefined();

    const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.body.pseudo).toBe('Nouveau Pseudo');
    expect(me.body).toHaveProperty('lieux_count');
    expect(me.body.activity).toBe('dj');
    expect(me.body.city).toBeTruthy();
    expect(me.body.city_geocoded_at).toBeTruthy();
  });

  it('register sans secteur → 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: `x-${Date.now()}@t.local`, password: 'password123', pseudo: 'X' });
    expect(res.status).toBe(400);
  });

  it('PATCH /auth/password change le mot de passe', async () => {
    const email = `pwd-${Date.now()}@test.local`;
    const reg = await request(app)
      .post('/auth/register')
      .send(registerBody({ email, pseudo: 'PwdUser' }));
    const token = reg.body.token;

    const bad = await request(app)
      .patch('/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong', newPassword: 'newpass123' });
    expect(bad.status).toBe(401);

    const ok = await request(app)
      .patch('/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'newpass123' });
    expect(ok.status).toBe(204);

    const loginOld = await request(app)
      .post('/auth/login')
      .send({ email, password: 'password123' });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app)
      .post('/auth/login')
      .send({ email: email.toUpperCase(), password: 'newpass123' });
    expect(loginNew.status).toBe(200);
  });
});
