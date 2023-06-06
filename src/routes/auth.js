import {
  AuthenticationError,
  RequestError,
} from '../constants/commonErrors.js';
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from '../tools/jwt.js';
import Prisma from '../tools/prisma.js';
import mailgun from 'mailgun-js';

const router = express.Router();
const mg = mailgun({
  apiKey: 'key-be435e340c2674abc7d433862acbe740',
  domain: 'api.connectorlando.tech',
});

export default router
  .post('/signup', async (request, response, next) => {
    try {
      if (!request.body.name || !request.body.email || !request.body.password) {
        throw new RequestError(
          'Must provide a valid name, email, and password'
        );
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
      // TODO: also, create a refreshToken and return to user
      // first - create new database (prisma) entry
      // then create a jwt with the user id
      // then return the refreshToken to the user
      response.json({ accessToken });
    } catch (error) {
      next(error);
    }
  })
  // TODO: a new endpoint called refresh
  // it will take in a refreshToken
  // verify the refreshToken
  // if it is valid, create a new accessToken
  // return the new accessToken

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

      response.json({ accessToken });
    } catch (error) {
      next(error);
    }
  });

router.post('/forgotPassword', async (request, response, next) => {
  try {
    if (!request.body.email) {
      throw new RequestError('Must provide a valid email');
    }

    const user = await Prisma.user.findUnique({
      where: {
        email: request.body.email,
      },
    });

    if (!user) {
      throw new RequestError('Account does not exist');
    }

    const resetToken = generateResetToken();

    await Prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken,
      },
    });

    sendResetPasswordEmail(user.email, resetToken);

    response.json({
      message: 'Password reset link has been sent to your email',
    });
  } catch (error) {
    next(error);
  }
});

function generateResetToken() {
  const resetToken = 'abcd1234';
  return resetToken;
}

async function sendResetPasswordEmail(email, resetToken) {
  const data = {
    from: 'Your Name <your-email@example.com>',
    to: email,
    subject: 'Password Reset',
    text: `Click on the following link to reset your password: https://example.com/resetPassword?token=${resetToken}`,
  };

  await mg.messages().send(data);
}
