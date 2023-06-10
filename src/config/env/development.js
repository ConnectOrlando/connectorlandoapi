export default {
  env: 'development',
  BASE_URL: 'http://localhost:3001',
  JWT_SECRET: 'REPLACE_WITH_RANDOM_SECRETKEY',
  PUBLIC_ROUTES: [
    '/auth/signup',
    '/auth/signin',
    '/auth/refresh',
    '/auth/signout',
  ],
};
