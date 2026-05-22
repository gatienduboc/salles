import { createApp } from './app.js';
import { config } from './config/index.js';

const app = await createApp();
app.listen(config.port, () => {
  console.log(`API Salles sur le port ${config.port}`);
});
