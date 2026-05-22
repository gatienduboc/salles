import knex from 'knex';
import knexConfig from '../../knexfile.js';

const env = process.env.NODE_ENV || 'development';
export const db = knex(knexConfig[env] || knexConfig.development);
