import {
  AuthenticationError,
  RequestError,
} from '../constants/commonErrors.js';
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from '../tools/jwt.js';
import Prisma from '../tools/prisma.js';
import TokenService from '../services/tokenService.js';
import Logger from '../tools/logger.js';

const router = express.Router();

router.post('/signup', async (request, response, next) => {
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

    const refreshToken = await TokenService.getSignedRefreshToken({
      request,
      userId: newUser.id,
    });
    response.json({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

router.post('/signin', async (request, response, next) => {
  try {
    if (!request.body.email || !request.body.password) {
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
      '15min'
    );

    const refreshToken = await TokenService.getSignedRefreshToken({
      request,
      userId: user.id,
    });

    response.json({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

router.post('/signout', async (request, response) => {
  try {
    if (request.body.refreshToken) {
      const refreshTokenInfo = await jwt.verify(request.body.refreshToken);
      await Prisma.refreshTokens.delete({
        where: {
          id: refreshTokenInfo?.refreshTokenId,
        },
      });
    }
  } catch (error) {
    Logger.info(
      `Possible that refreshToken did not exist and could not be deleted. \n Error Message: ${error.message}`
    );
  } finally {
    response.json({ message: 'Successfully logged out' });
  }
});

router.post('/refresh', async (request, res, next) => {
  try {
    const refreshToken = await TokenService.extractRefreshToken(
      request.body.refreshToken
    );
    const user = await Prisma.user.findUnique({
      where: { id: refreshToken.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    if (!user) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
      },
      '15min'
    );
    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

export default router;
