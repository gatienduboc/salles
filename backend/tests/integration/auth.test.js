import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/app.js';
import { resetDatabase, closeDatabase } from '../helpers/db.js';

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
      .send({ email, password: 'password123', pseudo: 'TestUser' });

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
    await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', pseudo: 'UserA' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', pseudo: 'UserB' });

    expect(res.status).toBe(409);
  });

  it('logout → 204', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(204);
  });
});
