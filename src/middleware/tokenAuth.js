/* eslint-disable require-atomic-updates */
import jwt from '../tools/jwt.js';
import {
  AuthenticationError,
  AuthorizationError,
} from '../constants/commonErrors.js';
import _ from 'lodash-es';
import authTypes from '../constants/authTypes.js';

export default async (request, response, next) => {
  if (request.isPublicRoute) {
    next();
  } else {
    try {
      if (!request?.headers.authorization) {
        throw new AuthenticationError(
          'Missing token. Check permissions and try again'
        );
      }
      // Token should be formatted like "Bearer JWT_TOKEN"
      if (!_.startsWith(request.headers.authorization, 'Bearer ')) {
        throw new AuthenticationError('Token malformed. Fix and try again');
      }
      const token = request.headers.authorization.split(' ')[1];
      const payload = await jwt.verify(token);
      if (!payload) {
        throw new AuthorizationError(
          'Unauthorized access token. Check permissions and try again'
        );
      }
      if (payload.authType !== authTypes.ACCESS) {
        throw new AuthorizationError(
          'Invalid token type. Check permissions and try again'
        );
      }
      delete payload.authType;
      request.authorizedUser = payload;
      next();
    } catch (error) {
      next(error);
    }
  }
};
