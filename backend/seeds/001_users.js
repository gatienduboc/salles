import bcrypt from 'bcrypt';

export async function seed(knex) {
  await knex('photos').del();
  await knex('lieux').del();
  await knex('users').del();

  const password_hash = await bcrypt.hash('password123', 10);
  await knex('users').insert([
    { email: 'demo@salles.local', password_hash, pseudo: 'Demo', role: 'user' },
  ]);
}
