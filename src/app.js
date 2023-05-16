import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes.js';
import morganMiddleware from './middleware/morgan.js';
import errorHandler from './middleware/errorHandler.js';
import config from './config.js';
import tokenAuth from './middleware/tokenAuth.js';

export default express()
  .use(cookieParser())
  .use(compression({ filter: shouldCompress }))
  .use(morganMiddleware)
  .use(
    cors({
      origin: config.CORS_WHITELIST ?? config.BASE_URL,
      methods: 'GET,PUT,POST,DELETE',
      allowedHeaders: 'Content-Type, Authorization',
    })
  )
  .get('/robots.txt', function (request, response) {
    response.type('text/plain');
    response.send('User-agent: *\nDisallow: /');
  })
  .use(helmet())
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .get('/', (request, response) => {
    response.status(200).send(`
        <div style="text-align: center">
          <h1>ConnectOrlando API</h1>
          <p>©2023 ConnectOrlando</p>
        </div>
      `);
  })
  .use(tokenAuth)
  .use('/', routes)
  .use(errorHandler)
  .use('*', (request, response) => {
    response.status(404).json({
      message: 'Endpoint does not exist',
    });
  });

function shouldCompress(request, response) {
  if (request.headers['x-no-compresponsesion']) {
    // don't compress responses with this request header
    return false;
  }
  return compression.filter(request, response);
}
