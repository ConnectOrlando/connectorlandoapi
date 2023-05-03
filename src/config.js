/* eslint-disable node/no-process-env */
import * as dotenv from 'dotenv';
import ObjectUtil from './util/objectUtil.js';

let CONFIG = null;
const IGNORED_ENTRIES = [];

async function initialize() {
  if (CONFIG === null) {
    CONFIG = {};
    dotenv.config({ override: true });
    parseDotEnvironmentVariables();
    await readEnvironmentVariables();
    processCorsWhitelist();
  }
  return ObjectUtil.finalize(CONFIG);
}

function parseDotEnvironmentVariables() {
  if (process.env && process.env.PUBLIC_ROUTES) {
    CONFIG.PUBLIC_ROUTES = process.env.PUBLIC_ROUTES.split(',');
    delete process.env.PUBLIC_ROUTES;
    IGNORED_ENTRIES.push('PUBLIC_ROUTES');
  }
}

function processCorsWhitelist() {
  if (CONFIG.CORS_WHITELIST && CONFIG.CORS_WHITELIST.includes(',')) {
    CONFIG.CORS_WHITELIST = CONFIG.CORS_WHITELIST.split(',').map(url => {
      return url.trim();
    });
  }
}

async function readEnvironmentVariables() {
  // read environment variables in built-in js file
  const environment = await getLocalEnvironment();
  addToConfig(environment);

  // read environment variables from root .env file
  // will overwrite built-in info
  addToConfig(process?.env);
}

function addToConfig(object) {
  if (object) {
    const entries = Object.keys(object);
    for (const entry of entries) {
      if (entry && object[entry] && !IGNORED_ENTRIES.includes(entry)) {
        CONFIG[entry] = object[entry];
      }
    }
  }
}

async function getLocalEnvironment() {
  let currentEnvironment = process?.env?.NODE_ENV;
  if (!['local', 'development', 'production'].includes(currentEnvironment)) {
    currentEnvironment = 'development';
  }
  try {
    const { default: environment } = await import(
      `./config/env/${currentEnvironment}.js`
    );
    return environment;
  } catch {
    return null;
  }
}

export default await initialize();
