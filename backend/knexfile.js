import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const base = {
  client: 'mysql2',
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' },
};

const connection = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.MYSQL_USER || process.env.DB_USER || 'salles',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database:
    process.env.NODE_ENV === 'test'
      ? process.env.MYSQL_DATABASE_TEST || 'salles_test'
      : process.env.MYSQL_DATABASE || 'salles',
};

export default {
  development: { ...base, connection },
  test: { ...base, connection: { ...connection, database: process.env.MYSQL_DATABASE_TEST || 'salles_test' } },
  production: { ...base, connection },
};
