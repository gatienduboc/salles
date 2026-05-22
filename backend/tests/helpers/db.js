import knex from 'knex';
import knexConfig from '../../knexfile.js';

export const testDb = knex(knexConfig.test);

export async function resetDatabase() {
  await testDb.migrate.rollback(undefined, true);
  await testDb.migrate.latest();
}

export async function closeDatabase() {
  await testDb.destroy();
}
