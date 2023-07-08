import jwt from '../tools/jwt.js';
import AuthTypes from '../constants/authTypes.js';
import Prisma from '../tools/prisma.js';
import { AuthenticationError } from '../constants/commonErrors.js';

/**
 * Creates and return a new signed refresh JWT
 *
 * @param {Object} Info - wrapper for params
 * @param {Request} Info.request - request object from middleware. Used to extract metadata.
 * @param {String} Info.userId - User's id
 * @return {JsonWebToken} Signed refresh token
 */
export default {
  getSignedRefreshToken,
  extractRefreshToken,
};
export async function getSignedRefreshToken({ request, userId }) {
  const refreshToken = await Prisma.refreshTokens.create({
    data: {
      ipAddress:
        request.headers['x-forwarded-for'] || request.socket.remoteAddress,
      userAgent: request.headers['user-agent'],
      userId,
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
  const refreshTokenInfo = await jwt.verify(signedRefreshToken);
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
