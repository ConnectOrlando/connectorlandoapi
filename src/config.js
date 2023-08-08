/* eslint-disable node/no-process-env */
import * as dotenv from 'dotenv';
import ObjectUtil from './util/objectUtil.js';

let CONFIG = null;
const IGNORED_ENTRIES = [];

function initialize() {
  if (CONFIG === null) {
    CONFIG = {};
    parseDotEnvironmentVariables();
    dotenv.config({ override: true });
    processEnvironmentVariables();
    processCorsWhitelist();
    CONFIG = ObjectUtil.finalize(CONFIG);
  }
}

function parseDotEnvironmentVariables() {
  if (process?.env) {
    if (process.env.PUBLIC_ROUTES) {
      CONFIG.PUBLIC_ROUTES = process.env.PUBLIC_ROUTES.split(',');
      IGNORED_ENTRIES.push('PUBLIC_ROUTES');
      delete process.env.PUBLIC_ROUTES;
    }
    // BASE_URL is used by the server to determine the URL to use for the API
    // When running locally, it should not be read from the .env file
    if (process.env.BASE_URL?.includes('localhost')) {
      delete process.env.BASE_URL;
    }
  }
}

function processCorsWhitelist() {
  if (CONFIG.CORS_WHITELIST && CONFIG.CORS_WHITELIST.includes(',')) {
    CONFIG.CORS_WHITELIST = CONFIG.CORS_WHITELIST.split(',').map(url => {
      return url.trim();
    });
  }
}

function processEnvironmentVariables() {
  if (process?.env) {
    const entries = Object.keys(process.env);
    for (const entry of entries) {
      if (entry && process.env[entry] && !IGNORED_ENTRIES.includes(entry)) {
        CONFIG[entry] = process.env[entry];
      }
    }
  }
}

initialize();
export default CONFIG;
