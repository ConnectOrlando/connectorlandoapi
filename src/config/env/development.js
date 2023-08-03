export default {
  env: 'development',
  JWT_SECRET: 'REPLACE_WITH_RANDOM_SECRETKEY',
  PUBLIC_ROUTES: [
    '/auth/signup',
    '/auth/signin',
    '/auth/refresh',
    '/auth/signout',
    '/auth/forgot-password',
  ],
  CLIENT_URL: 'https://app.connectorlando.tech',
};
