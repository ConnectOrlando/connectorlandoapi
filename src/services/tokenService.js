import jwt from '../tools/jwt.js';
import AuthTypes from '../constants/authTypes.js';
import Prisma from '../tools/prisma.js';
import { AuthenticationError } from '../constants/commonErrors.js';
import _ from 'lodash-es';

/**
 * Creates and return a new signed refresh JWT
 *
 * @param {Object} Info - wrapper for params
 * @param {Request} Info.request - request object from middleware. Used to extract metadata.
 * @param {String} Info.user - User object, must contain id
 * @return {JsonWebToken} Signed refresh token
 */
export default {
  getSignedRefreshToken,
  extractRefreshToken,
  createAccessToken,
};

export async function getSignedRefreshToken({ request, user }) {
  validateRequest(request);
  validateUser(user);

  const refreshToken = await Prisma.refreshTokens.create({
    data: {
      ipAddress:
        request.headers['x-forwarded-for'] || request.socket.remoteAddress,
      userAgent: request.headers['user-agent'],
      userId: user?.id,
    },
  });
  return jwt.sign(
    {
      refreshTokenId: refreshToken.id,
      authType: AuthTypes.REFRESH,
    },
    '1y'
  );
}

/**
 * Extracts Refresh Token using Refresh JWT id
 * @param {JsonWebToken} signedRefreshToken
 * @returns {RefreshToken} RefreshToken database object
 */

export async function extractRefreshToken(signedRefreshToken, request) {
  if (!_.isString(signedRefreshToken) || _.isEmpty(signedRefreshToken)) {
    throw new AuthenticationError('TokenService:::Refresh token not provided');
  }
  validateRequest(request);

  const refreshTokenInfo = await jwt.verify(signedRefreshToken);
  if (refreshTokenInfo?.authType !== AuthTypes.REFRESH) {
    throw new AuthenticationError('Invalid refresh token');
  }
  const refreshToken = await Prisma.refreshTokens.findUnique({
    where: { id: refreshTokenInfo?.refreshTokenId },
  });
  if (!refreshToken) {
    throw new AuthenticationError('Refresh token not found');
  }

  const ipAddress =
    request.headers['x-forwarded-for'] || request.socket.remoteAddress;
  const userAgent = request.headers['user-agent'];
  if (
    refreshToken.ipAddress !== ipAddress ||
    refreshToken.userAgent !== userAgent
  ) {
    throw new AuthenticationError(
      'Security issue found with refresh token. Please sign in again to get a new refresh token.'
    );
  }

  return refreshToken;
}

/**
 * Creates and returns a new signed access JWT
 *
 * @param {Object} user - User object, must contain id
 * @returns {JsonWebToken} Signed access token
 */
export async function createAccessToken(user) {
  validateUser(user);
  const accessToken = jwt.sign(
    {
      id: user.id,
      authType: AuthTypes.ACCESS,
    },
    '15min'
  );
  return accessToken;
}

function validateUser(user) {
  if (!user?.id || !_.isString(user.id)) {
    throw new Error('TokenService:::User id not provided');
  }
}

function validateRequest(request) {
  if (!request || !_.isObject(request) || _.isEmpty(request)) {
    throw new Error('TokenService:::Request not provided');
  }
}
