import bcrypt from 'bcrypt';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'gatien.duboc@gmail.com').toLowerCase();
const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'password123';

export async function seed(knex) {
  const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const updated = await knex('users').where({ email: ADMIN_EMAIL }).update({
    password_hash,
    role: 'admin',
  });

  if (updated === 0) {
    await knex('users').insert({
      email: ADMIN_EMAIL,
      password_hash,
      pseudo: 'Gatien',
      role: 'admin',
    });
    console.log(`005_reset_admin_password : compte créé (${ADMIN_EMAIL}).`);
  } else {
    console.log(`005_reset_admin_password : mot de passe réinitialisé pour ${ADMIN_EMAIL}.`);
  }
  console.log(`Mot de passe par défaut : ${DEFAULT_PASSWORD} (ADMIN_DEFAULT_PASSWORD)`);
}
