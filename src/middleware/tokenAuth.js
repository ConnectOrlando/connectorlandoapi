/* eslint-disable require-atomic-updates */
import jwt from '../tools/jwt.js';
import config from '../config.js';
import {
  AuthenticationError,
  AuthorizationError,
} from '../constants/commonErrors.js';

export default async (request, res, next) => {
  if (
    config?.PUBLIC_ROUTES?.includes('*') ||
    config?.PUBLIC_ROUTES?.includes(request.path)
  ) {
    next();
  } else {
    try {
      if (!request?.headers.authorization) {
        throw new AuthenticationError(
          'Missing token. Check permissions and try again.'
        );
      }
      // Token should be formatted like "Bearer JWT_TOKEN"
      const token = request.headers.authorization.split(' ')[1];
      const accessToken = await jwt.verify(token);
      if (!accessToken) {
        throw new AuthorizationError(
          'Unauthorized access token. Check permissions and try again.'
        );
      }
      request.authorizedUser = accessToken;
      next();
    } catch (error) {
      next(error);
    }
  }
};
