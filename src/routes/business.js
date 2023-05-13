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

router.get('/:userId/favorites', async (request, response, next) => {
  try {
    if (!request.params.userId) {
      throw new RequestError('Must provide a valid userId');
    }
    const user = await Prisma.user.findUnique({
      where: {
        id: request.params.userId,
      },
      include: {
        favorites: {
          include: {
            business: true,
          },
          orderBy: {
            business: {
              name: 'asc',
            },
          },
        },
      },
    });
    if (!user) {
      throw new RequestError(
        `Could not find user with id ${request.params.userId}`
      );
    }
    response.json(user.favorites.map(favorite => favorite.business));
  } catch (error) {
    next(error);
  }
});
// retrieve user's connected businesses
router.get('/connected', async (request, response, next) => {
  try {
    const userId = request.user.id;

    // find user in database
    const user = await Prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        connectedBusinesses: true,
      },
    });

    if (!user) {
      throw new RequestError(`Could not find user with id ${userId}`);
    }

    // return user's connected businesses
    const businesses = user.connectedBusinesses;

    response.json(businesses);
  } catch (error) {
    next(error);
  }
});
