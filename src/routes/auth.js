import {
  AuthenticationError,
  RequestError,
} from '../constants/commonErrors.js';
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from '../tools/jwt.js';
import Prisma from '../tools/prisma.js';

const router = express.Router();

export default router
  .post('/signup', async (request, response, next) => {
    try {
      if (!request.body.email || !request.body.password) {
        throw new RequestError('Must provide a valid  email, and password');
      }
      const user = await Prisma.user.findUnique({
        where: {
          email: request.body.email,
        },
      });
      if (user) {
        throw new RequestError('An account with that email already exists');
      }
      const passwordHash = await bcrypt.hash(request.body.password, 10);
      const newUser = await Prisma.user.create({
        data: {
          email: request.body.email.toLowerCase(),
          password: passwordHash,
        },
        // TODO: ACTIVITY TOKEN
      });
      const accessToken = jwt.sign(
        {
          id: newUser.id,
        },
        '1w'
      );
      response.json({ accessToken });
    } catch (error) {
      next(error);
    }
  })

  .post('/signin', async (request, response, next) => {
    try {
      if (!request.body.name || !request.body.email || !request.body.password) {
        throw new RequestError('Must provide a valid email and password');
      }
      const user = await Prisma.user.findUnique({
        where: {
          email: request.body.email,
        },
      });
      if (!user) {
        throw new RequestError('Account does not exist');
      }
      const isAuthenticated = await bcrypt.compare(
        request.body.password,
        user.password
      );
      if (!isAuthenticated) {
        throw new AuthenticationError('Cannot verify login information');
      }
      const accessToken = jwt.sign(
        {
          id: user.id,
        },
        '1w'
      );

      // TODO: activity token
      response.json({ accessToken });
    } catch (error) {
      next(error);
    }
  });
