import _ from 'lodash-es';
import { ArchivedError, RequestError } from '../constants/commonErrors.js';
import bcrypt from 'bcrypt';
import express from 'express';
import Prisma from '../tools/prisma.js';
import jwt from '../tools/jwt.js';
const router = express.Router();

export default router
  // create
  .post('/', async (request, response, next) => {
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
        throw new RequestError('Email already exists');
      }

      const passwordHash = await bcrypt.hash(request.body.password, 10);
      const newUser = await Prisma.user.create({
        data: {
          name: request.body.name,
          email: request.body.email.toLowerCase(),
          password: passwordHash,
        },
      });
      response.json(newUser);
    } catch (error) {
      next(error);
    }
  })
  .get('/', async (request, response) => {
    const user = await Prisma.user.findUnique({
      where: {
        id: request.authenticatedUser.id,
      },
    });

    const trimmedUser = _.pick(user, [
      'id',
      'name',
      'email',
      'isEmailVerified',
      'bio',
      'profileImage',
    ]);
    response.json({ user: trimmedUser });
  })
  // read
  .get('/:id', async (request, response, next) => {
    try {
      if (!request.params.id) {
        throw new RequestError('Must provide a valid id');
      }
      const user = await Prisma.user.findUnique({
        where: {
          id: request.params.id,
        },
      });
      if (!user) {
        throw new RequestError('User not found');
      }
      if (user.isArchived) {
        throw new ArchivedError('Account already deleted');
      }

      const trimmedUser = _.pick(user, ['name', 'email', 'profile']);
      response.json({
        user: trimmedUser,
      });
    } catch (error) {
      next(error);
    }
  })
  //update
  .patch('/:id', async (request, response, next) => {
    try {
      if (!request.params.id) {
        throw new RequestError('Must provide a valid id');
      }

      const dataToUpdate = _.pick(request.body, [
        'name',
        'profileImage',
        'title',
        'isInvestor',
        'linkedin',
      ]); //etc, nothing compromising!
      await Prisma.user.update({
        where: {
          id: request.params.id,
        },
        data: dataToUpdate,
      });
      response.json({
        message: 'Succesfully updated user',
      });
    } catch (error) {
      next(error);
    }
  })
  //delete
  .delete('/:id', async (request, response) => {
    // non blocking - send notes about async/await
    await Prisma.user.update({
      where: {
        id: request.params.id,
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });
    response.json({
      message: 'Successfully archived user',
    });
  })
  .get('/user', async (request, response, next) => {
    try {
      const token = request.headers.authorization.split(' ')[1];
      const decodedToken = jwt.verify(token);
      const user = await Prisma.user.findUnique({
        where: {
          id: decodedToken.id,
        },
      });
      response.json(user);
    } catch (error) {
      next(error);
    }
  });
