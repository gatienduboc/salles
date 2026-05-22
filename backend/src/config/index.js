import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../data/uploads'),
  nominatim: {
    userAgent: process.env.NOMINATIM_USER_AGENT || 'Salles/1.0 (dev@localhost)',
    baseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
    timeoutMs: Number(process.env.NOMINATIM_TIMEOUT_MS || 5000),
    minIntervalMs: Number(process.env.NOMINATIM_MIN_INTERVAL_MS || 1100),
  },
  apiPublicUrl: process.env.API_PUBLIC_URL || 'http://localhost:3000',
  /** URLs photos (/uploads), sans suffixe /api */
  sitePublicUrl: (process.env.SITE_PUBLIC_URL || process.env.API_PUBLIC_URL || 'http://localhost:3000').replace(
    /\/api\/?$/,
    ''
  ),
  adminEmail: (process.env.ADMIN_EMAIL || 'gatien.duboc@gmail.com').toLowerCase(),
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'password123',
};
