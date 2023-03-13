import express from 'express';
import userRoutes from './routes/user.js';

export default express.Router().use('/user', userRoutes);
