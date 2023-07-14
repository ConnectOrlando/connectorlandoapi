import express from 'express';
import { ArchivedError, RequestError } from '../constants/commonErrors.js';
import Prisma from '../tools/prisma.js';
import _ from 'lodash-es';
import jwt from '../tools/jwt.js';
import { AuthenticationError } from '../constants/commonErrors.js';
const router = express.Router();

console.log(_.isString('hello'));
console.log(_.isString('') && !_.isEmpty(''));
console.log(_.isString('          ') && _.isEmpty('          '));
console.log(_.isString('          t'));
console.log(_.isString('          t           '));

router.get('/:id', async (request, response, next) => {
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
      throw new RequestError(`Could not find that business`);
    }
    if (business.isArchived) {
      throw new ArchivedError('Business account already deleted');
    }

    _.pick(business, ['name', 'email', 'profile']); //etc
    response.json({ business });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
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
    });

    response.json({ business: newBusiness });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (request, response, next) => {
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
});

router.delete('/:id', async (request, response, next) => {
  console.log('Here');
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

router.get('/favorites', async (request, response, next) => {
  try {
    if (!request.headers.authorization) {
      throw new AuthenticationError('Access token missing');
    }

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
      throw new RequestError(
        `Could not find user with id ${request.authorizedUser.id}`
      );
    }
    response.json(user.favorites.map(favorite => favorite.business));
  } catch (error) {
    next(error);
  }
});

router.get('/connected', async (request, response, next) => {
  try {
    if (!request.headers.authorization) {
      throw new AuthenticationError('Access token missing');
    }

    const user = await Prisma.user.findUnique({
      where: {
        id: request.authorizedUser.id,
      },
      include: {
        connectedBusinesses: true,
      },
    });

    if (!user) {
      throw new RequestError(
        `Could not find user with id ${request.authorizedUser.id}`
      );
    }

    response.json(user.connectedBusinesses);
  } catch (error) {
    next(error);
  }
});

router.post('/favorites/:id', async (request, response, next) => {
  try {
    if (!request.headers.authorization) {
      throw new AuthenticationError('Access token missing');
    }
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
  } catch (error) {
    next(error);
  }
});

router.post('/connections/:id', async (request, response, next) => {
  try {
    if (!request.headers.authorization) {
      throw new AuthenticationError('Access token missing');
    }
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
  } catch (error) {
    next(error);
  }
});
export default router;
