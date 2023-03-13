import express from 'express';
import { RequestError } from '../constants/commonErrors.js';
import Prisma from '../tools/prisma.js';
import bcrypt from 'bcrypt';

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
      // TODO: Check if email already exists in db. if, so return error
      const passwordHash = await bcrypt.hash(request.body.password, 10);
      const user = await Prisma.user.create({
        data: {
          name: request.body.name,
          email: request.body.email.toLowerCase(),
          password: passwordHash,
        },
      });
      response.json(user);
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
      // TODO: Check if user is archived. if so, return an error
      // TODO: Don't return all fields (exclude for example, password, isArchived)
      response.json({
        user,
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
      await Prisma.user.update({
        where: {
          id: request.params.id,
        },
        // TODO: be selective about which fields can be updated
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
