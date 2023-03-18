import config from '../config.js';
import winston from 'winston';

const { combine, timestamp, colorize, printf } = winston.format;
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const environment = config.env || 'development';
  const isDevelopment = environment === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  http: 'green',
  debug: 'magenta',
};

winston.addColors(colors);

const customFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  colorize({ all: true }),
  printf(info => {
    if (info instanceof Error) {
      return `${info.timestamp} [${info.level}]:\n${info.stack}`;
    }
    return `${info.timestamp} [${info.level}]: ${info.message}`;
  })
);

const transports = [
  new winston.transports.Console({
    handleExceptions: true,
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    handleExceptions: true,
  }),
  new winston.transports.File({
    filename: 'logs/all.log',
    handleExceptions: true,
  }),
];

const Logger = winston.createLogger({
  level: level(),
  levels,
  format: customFormat,
  transports,
  exitOnError: false,
});

export default Logger;
