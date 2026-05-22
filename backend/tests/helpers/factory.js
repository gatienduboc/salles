import bcrypt from 'bcrypt';
import { testDb } from './db.js';
import { signToken } from '../../src/utils/jwt.js';

export async function createUser(overrides = {}) {
  const { password: plainPassword, email, pseudo, ...rest } = overrides;
  const password_hash = await bcrypt.hash(plainPassword || 'password123', 10);
  const [id] = await testDb('users').insert({
    email: email || `user-${Date.now()}@test.local`,
    password_hash,
    pseudo: pseudo || 'TestUser',
    role: 'user',
    ...rest,
  });
  const user = await testDb('users').where({ id }).first();
  const token = signToken(user);
  return { user, token };
}

export async function createLieu(auteurId, overrides = {}) {
  const [id] = await testDb('lieux').insert({
    nom: 'Lieu test',
    adresse: '1 avenue Test, Lyon, France',
    type: 'blacklist',
    auteur_id: auteurId,
    ville: 'Lyon',
    latitude: 45.75,
    longitude: 4.85,
    geocoded_at: testDb.fn.now(),
    ...overrides,
  });
  return testDb('lieux').where({ id }).first();
}
