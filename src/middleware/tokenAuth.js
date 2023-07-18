/* eslint-disable require-atomic-updates */
import jwt from '../tools/jwt.js';
import config from '../config.js';
import {
  AuthenticationError,
  AuthorizationError,
} from '../constants/commonErrors.js';
import _ from 'lodash-es';

export default async (request, response, next) => {
  if (checkIfRouteIsPublic(request.path)) {
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

function checkIfRouteIsPublic(route) {
  if (_.last(route) === '/') {
    route = route.slice(0, -1);
  }
  return (
    config?.PUBLIC_ROUTES?.includes('*') || config.PUBLIC_ROUTES.includes(route)
  );
}
