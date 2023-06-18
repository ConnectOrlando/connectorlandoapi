import app from './src/app.js';
import Logger from './src/tools/logger.js';
import config from './src/config.js';

const port = config.PORT || 3001;

app.listen(port, () => {
  Logger.info(
    `ConnectOrlandoAPI listening at ${
      config.BASE_URL || `http://localhost:${port}`
    }`
  );
});
