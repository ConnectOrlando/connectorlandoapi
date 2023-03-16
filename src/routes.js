import express from 'express';
import userRoutes from './routes/user.js';
import businessRoutes from './routes/business.js';

export default express
  .Router()
  .use('/user', userRoutes)
  .use('/business', businessRoutes);
