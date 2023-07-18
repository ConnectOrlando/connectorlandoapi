import _ from 'lodash-es';
import { ArchivedError, RequestError } from '../constants/commonErrors.js';
import express from 'express';
import Prisma from '../tools/prisma.js';

import { AuthenticationError } from '../constants/commonErrors.js';
const router = express.Router();

router.get('/', async (request, response, next) => {
  try {
    if (!request.headers.authorization) {
      throw new AuthenticationError('Access token missing');
    }
    const user = await Prisma.user.findUnique({
      where: {
        id: request.authorizedUser.id,
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
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (request, response, next) => {
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
});

router.patch('/:id', async (request, response, next) => {
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
    ]);
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
});

router.delete('/:id', async (request, response, next) => {
  try {
    if (!request.params.id) {
      throw new RequestError('Must provide a valid id');
    }
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
  } catch (error) {
    next(error);
  }
});

router.get('/user', async (request, response, next) => {
  try {
    const user = await Prisma.user.findUnique({
      where: {
        id: request.authorizedUser.id,
      },
    });
    response.json(user);
  } catch (error) {
    next(error);
  }
});
export default router;
