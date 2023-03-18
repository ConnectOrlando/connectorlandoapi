import express from 'express';
import userRoutes from './routes/user.js';
import businessRoutes from './routes/business.js';
import authRoutes from './routes/auth.js';

export default express
  .Router()
  .use('/auth', authRoutes)
  .use('/business', businessRoutes)
  .use('/user', userRoutes);
