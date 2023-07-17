import _ from 'lodash-es';
import { ArchivedError, RequestError } from '../constants/commonErrors.js';
import bcrypt from 'bcrypt';
import express from 'express';
import Prisma from '../tools/prisma.js';

import { AuthenticationError } from '../constants/commonErrors.js';
const router = express.Router();

router.post('/', async (request, response, next) => {
  try {
    if (!request.body.name || !request.body.email || !request.body.password) {
      throw new RequestError('Must provide a valid name, email, and password');
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
});

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

// PATCH is the HTTP request type for updating an existing resource
// it requires the id of the resource to be passed in (:id)
router.patch('/:id', async (request, response, next) => {
  try {
    // check if the id is provided
    if (!request.params.id) {
      throw new RequestError('Must provide a valid id');
    }

    /*
      the _.pick method from lodash allows us to pick only the fields we want from the request body.
      this is a security measure to prevent users from updating fields they shouldn't be able to.

      -------------------------

      for example, we don't want users to be able to update their email address,
      so we don't include it in the list of fields to update

      we pass in the request.body object as the first argument to _.pick
      this is the object that contains all the fields the user is trying to update
      (post body data - in postman, this is the data in the body tab in JSON)

      the array of fields to pick is the second argument to _.pick.
      we can add or remove fields from this array as needed

      the _.pick method returns an object with only the fields we picked from the request body
      meaning the object we pass to Prisma.user.update will only contain the fields we want to update

      -------------------------

      for example, if the user sends a request to update their name and email,
      the request.body object will look like this:
      {
        name: 'New Name',
        email: 'email@example.com',
      }

      after we pass this object to _.pick, the object will look like this:
      {
        name: 'New Name',
      }

      because email is not in the array of fields to pick

      -------------------------

      more info on _.pick: https://www.geeksforgeeks.org/lodash-_-pick-method/
    */
    const dataToUpdate = _.pick(request.body, [
      'name',
      'profileImage',
      'title',
      'isInvestor',
      'linkedin',
    ]);

    /*
      update the user in the database
      we use the Prisma.user.update method to update the user
      we pass in the id of the user we want to update as the first argument
      we pass in the data we want to update as the second argument
    */
    await Prisma.user.update({
      where: {
        id: request.params.id,
      },
      data: dataToUpdate,
    });
    // send a response to the client
    response.json({
      message: 'Succesfully updated user',
    });
  } catch (error) {
    // if an error occurs, pass it to the next middleware function
    // (we will talk more about next later on)
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
