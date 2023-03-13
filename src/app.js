import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes.js';
import morganMiddleware from './middleware/morgan.js';
import errorHandler from './middleware/errorHandler.js';
import { config } from 'dotenv';

export default express()
  .use(cookieParser())
  .use(compression({ filter: shouldCompress }))
  .use(morganMiddleware)
  .use(
    cors({
      origin: config.BASE_URL,
      methods: 'GET,PUT,POST,DELETE',
      allowedHeaders: 'Content-Type, Authorization',
    })
  )
  .use(helmet())
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .get('/', (request, res) => {
    res.status(200).send(`
        <div style="text-align: center">
          <h1>ConnectOrlando API</h1>
          <p>©2023 ConnectOrlando</p>
        </div>
      `);
  })
  .use('/', routes)
  .use(errorHandler)
  .use('*', (request, res) => {
    res.status(404).json({
      message: 'Endpoint does not exist',
    });
  });

function shouldCompress(request, res) {
  if (request.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false;
  }
  return compression.filter(request, res);
}
