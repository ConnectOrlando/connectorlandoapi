import app from './src/app.js';
import Logger from './src/tools/logger.js';
import { config } from 'dotenv';

app.listen(config.PORT || 3001, () => {
  Logger.info(
    `ConnectOrlandoAPI listening at ${
      config.BASE_URL || 'http://localhost:3001'
    }`
  );
});
