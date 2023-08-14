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
import validator from 'validator';
import emailService from '../services/emailService.js';
import config from '../config.js';

const router = express.Router();

router.post('/signup', async (request, response, next) => {
  try {
    if (!request.body.name) {
      throw new RequestError('Must provide a valid name');
    }
    if (!request.body.password) {
      throw new RequestError('Must provide a valid password');
    }
    if (!request.body.email || !validator.isEmail(request.body.email)) {
      throw new RequestError('Must provide a valid email');
    }
    const user = await Prisma.user.findUnique({
      where: {
        email: request.body.email.toLowerCase(),
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
    });
    const accessToken = await TokenService.createAccessToken(newUser);
    const refreshToken = await TokenService.getSignedRefreshToken({
      request,
      user: newUser,
    });
    response.json({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

router.post('/signin', async (request, response, next) => {
  try {
    if (!request.body.email || !request.body.password) {
      throw new RequestError('Must provide a valid email and password', 400);
    }
    const user = await Prisma.user.findUnique({
      where: {
        email: request.body.email,
      },
    });
    if (!user) {
      throw new RequestError('Cannot verify user information', 400);
    }
    const isAuthenticated = await bcrypt.compare(
      request.body.password,
      user.password
    );
    if (!isAuthenticated) {
      throw new AuthenticationError('Cannot verify login information');
    }
    const accessToken = await TokenService.createAccessToken(user);

    const refreshToken = await TokenService.getSignedRefreshToken({
      request,
      user,
    });
    if (request.body.password.length < 6) {
      throw new RequestError('Password must be at least 6 characters long');
    }

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
      request.body.refreshToken,
      request
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
    const accessToken = await TokenService.createAccessToken(user);

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});
router.post('/forgot-password', async (request, response, next) => {
  if (!request.body.email) {
    next(new RequestError('Must provide a valid email'));
    return;
  }

  try {
    const user = await Prisma.user.findUnique({
      where: {
        email: request.body.email.toLowerCase(),
      },
    });

    if (user) {
      const resetToken = jwt.sign({ email: user.email }, '1w');

      const resetLink = `${config.CLIENT_URL}/reset-password?-token=${resetToken}`;

      await emailService.sendTextEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: `Hi ${user.name},\n\nYou have requested to reset your password. Please click on the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.\n,\n ConnectOrlando`,
      });
    }
  } catch (error) {
    Logger.error(error);
  } finally {
    response.json({ message: 'Password reset request has been processed.' });
  }
});
export default router;
