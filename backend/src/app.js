import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import lieuxRouter from './routes/lieux.js';
import photosRouter from './routes/photos.js';

export async function createApp(options = {}) {
  await fs.mkdir(config.uploadDir, { recursive: true });

  const app = express();
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use('/uploads', express.static(config.uploadDir));
  app.use((req, res, next) => {
    req.geocodeOptions = options.geocodeOptions || {};
    next();
  });

  app.use(healthRouter);
  app.use(authRouter);
  app.use(lieuxRouter);
  app.use(photosRouter);

  app.use(errorHandler);
  return app;
}
