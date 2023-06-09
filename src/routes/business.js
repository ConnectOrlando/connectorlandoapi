import express from 'express';
import { ArchivedError, RequestError } from '../constants/commonErrors.js';
import Prisma from '../tools/prisma.js';
import _ from 'lodash-es';
import jwt from '../tools/jwt.js';
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

      _.pick(business, ['name', 'email', 'profile']);
      response.json(business);
    } catch (error) {
      next(error);
    }
  })

  // create
  .post('/', async (request, response, next) => {
    try {
      const { name, type, mission } = request.body;

      if (!name || !type || !mission) {
        throw new RequestError('Must provide a valid name, type, and mission');
      }

      const newBusiness = await Prisma.business.create({
        data: {
          name,
          type,
          mission,
        },
        select: {
          name: true,
          type: true,
          mission: true,
        },
      });

      response.json(newBusiness);
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
    try {
      if (!request.params.id) {
        throw new RequestError('Must provide a valid id');
      }
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

router.get('/favorites', async (request, response) => {
  const accessToken = request.headers.authorization.split(' ')[1];
  const payload = await jwt.verify(accessToken);
  const userID = payload.id;
  const user = await Prisma.user.findUnique({
    where: {
      id: request.authorizedUser.id,
    },
    include: {
      favorites: {
        include: {
          business: true,
        },
      },
    },
  });
  if (!user) {
    throw new RequestError(`Could not find user with id ${userID}`);
  }
  response.json(user.favorites.map(favorite => favorite.business));
});

// retrieve user's connected businesses
router.get('/connected', async (request, response) => {
  const accessToken = request.headers.authorization.split(' ')[1];
  const payload = await jwt.verify(accessToken);
  const userID = payload.id;
  const user = await Prisma.user.findUnique({
    where: {
      id: request.authorizedUser.id,
    },
    include: {
      connectedBusinesses: true,
    },
  });

  if (!user) {
    throw new RequestError(`Could not find user with id ${userID}`);
  }

  response.json(user.connectedBusinesses);
});
// Add a business to user's favorites
router.post('/favorites/:id', async (request, response) => {
  const accessToken = request.headers.authorization.split(' ')[1];
  const payload = await jwt.verify(accessToken);

  if (!request.params.id) {
    throw new RequestError('Must provide a valid business id');
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
  await Prisma.user.update({
    where: {
      id: payload.id,
    },
    data: {
      favorites: {
        connect: {
          id: business.id,
        },
      },
    },
  });

  response.json({
    message: 'Business successfully added to favorites',
  });
});

// Add a business as user's connection
router.post('/connections/:id', async (request, response) => {
  const accessToken = request.headers.authorization.split(' ')[1];
  const payload = await jwt.verify(accessToken);

  if (!request.params.id) {
    throw new RequestError('Must provide a valid business id');
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

  await Prisma.investorConnection.create({
    data: {
      userId: payload.id,
      businessId: business.id,
    },
  });

  response.json({
    message: 'Business successfully added as connection',
  });
});
