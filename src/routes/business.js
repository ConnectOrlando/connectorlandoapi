import express from 'express';
import { ArchivedError, RequestError } from '../constants/commonErrors.js';
import Prisma from '../tools/prisma.js';
import _ from 'lodash-es';
const router = express.Router();

export default router
  .get('/:id', async (request, response, next) => {
    try {
      if (!request.params.id) {
        throw new RequestError('Must provide a valid id');
      }
      const business = await Prisma.business.findUnique({
        where: {
          id: request.params.id,
        },
      });
      if (!business) {
        throw new RequestError(
          `Could not find business with id ${request.params.id}`
        );
      }
      if (business.isArchived) {
        throw new ArchivedError('Business account already deleted');
      }

      _.pick(business, ['name', 'email', 'profile']); //etc
      response.json(business);
    } catch (error) {
      next(error);
    }
  })

  // create
  .post('/', async (request, response, next) => {
    try {
      if (!request.body.name || !request.body.type || !request.body.mission) {
        throw new RequestError('Must provide a valid name, type, and mission');
        // To create business in database
      }
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
      const cleanbody = _.pick(request.body, ['name', 'type', 'mission', '']);
      if (_.isEmpty(cleanbody)) {
        throw new RequestError('Nothing to update');
      }
      await Prisma.business.update({
        where: {
          id: request.params.id,
        },
        data: cleanbody,
      });
      response.json({
        message: 'Succesfully updated business',
      });
    } catch (error) {
      next(error);
    }
  })
  //delete
  .delete('/:id', async (request, response, next) => {
    console.log('Here');
    try {
      if (!request.params.id) {
        throw new RequestError('Must provide a valid id');
      }
      // non blocking - send notes about async/await
      await Prisma.business.update({
        where: {
          id: request.params.id,
        },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });
      response.json({
        message: 'Successfully archived business',
      });
    } catch {
      next();
    }
  });