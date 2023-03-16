import express from 'express';

const router = express.Router();

export default router
  // create
  .post('/signup', async (request, response, next) => {
    try {
      // TODO: what should happen when user signs up?
      // need email & password, maybe name?
      // check if exists
      // if not, create new user
      // return new accessToken (JWT) containing their ID

      response.json({
        message: 'Change me',
      });
    } catch (error) {
      next(error);
    }
  })
  .post('/signin', async (request, response, next) => {
    try {
      // TODO: what should happen when user signs in?
      // need email and password only
      // retrieve user from db
      // compare the password to the hash

      // to use this, import bcrypt (as seen in user route)
      // const isAuthenticated = await bcrypt.compare(INPUT_PASSWORD, PASSWORD_HASH);
      response.json({
        message: 'Change me',
      });
    } catch (error) {
      next(error);
    }
  });
