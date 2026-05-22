const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'gatien.duboc@gmail.com';

export async function up(knex) {
  const updated = await knex('users').where({ email: ADMIN_EMAIL }).update({ role: 'admin' });
  if (updated === 0) {
    console.warn(`005_promote_admin: aucun utilisateur avec email ${ADMIN_EMAIL}`);
  }
}

export async function down(knex) {
  await knex('users').where({ email: ADMIN_EMAIL }).update({ role: 'user' });
}
