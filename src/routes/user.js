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
  // TODO:  laura - read by the token id
  .get('/', async (request, response, next) => {
    try {
      request.header.authorization;
      const accessToken = request.headers.authorization.split(' ')[1];
      const payload = await jwt.verify(accessToken);
      console.log(payload.id);
      const user = await Prisma.user.findUnique({
        where: {
          id: payload.id,
        },
      });
      console.log(user); // TODO: finish writing what to return
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
      if (user.isArchived) {
        throw new ArchivedError('Account already deleted');
      }

      _.pick(user, ['name', 'email', 'profile']); //etc TODO: finish writing the return
      response.json(user);
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
      // TODO: Currently not picking request body
      _.pick(request.body, [
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
        data: request.body,
      });
      response.json({
        message: 'Succesfully updated user',
      });
    } catch (error) {
      next(error);
    }
  })
  //delete
  .delete('/:id', async (request, response, next) => {
    try {
      if (!request.params.id) {
        throw new RequestError('Must provide a valid id');
      }
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
    } catch {
      next();
    }
  });
