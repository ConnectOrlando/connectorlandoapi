import {
  AuthenticationError,
  RequestError,
} from '../constants/commonErrors.js';
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from '../tools/jwt.js';
import Prisma from '../tools/prisma.js';

const router = express.Router();

export default router.post('/signup', async (request, response, next) => {
  try {
    if (!request.body.name || !request.body.email || !request.body.password) {
      throw new RequestError('Must provide a valid name, email, and password');
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
        name: request.body.name,
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
});

router.post('/refresh', async (request, response, next) => {
  try {
    const { refreshToken } = request.body;
    if (!refreshToken) {
      throw new RequestError('Refresh token is required');
    }

    // Verify and decode the refresh token
    const decodedToken = jwt.verify(refreshToken, 'refreshTokenSecret');

    // Retrieve the user from the decoded token
    const user = await Prisma.user.findUnique({
      where: {
        id: decodedToken.id,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Generate a new access token
    const accessToken = jwt.sign({ id: user.id }, 'accessTokenSecret', {
      expiresIn: '15m',
    });

    response.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

router
  .post('/refresh', async (request, response, next) => {
    try {
      const { refreshToken } = request.body;
      if (!refreshToken) {
        throw new RequestError('Refresh token is required');
      }

      const decodedToken = jwt.verify(refreshToken, 'refreshTokenSecret');

      const user = await Prisma.user.findUnique({
        where: {
          id: decodedToken.id,
        },
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      const accessToken = jwt.sign({ id: user.id }, 'accessTokenSecret', {
        expiresIn: '15m',
      });

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
