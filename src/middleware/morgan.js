import morgan from 'morgan';
import config from '../config.js';
import Logger from '../tools/logger.js';

const stream = {
  write: message => Logger.http(message),
};

function getFormat() {
  return config.env === 'development' ? 'dev' : 'short';
}

export default morgan(getFormat(), { stream });
