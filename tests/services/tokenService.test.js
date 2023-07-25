import authTypes from '../../src/constants/authTypes.js';
import TokenService from '../../src/services/tokenService.js';
import jwt from '../../src/tools/jwt.js';
import prisma from '../../src/tools/prisma.js';

describe('TokenService Tests', () => {
  let user;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        name: 'Chester Tester',
        email: 'test@example.com',
      },
    });
  });

  describe('createAccessToken tests', () => {
    it('should create a valid access token', async () => {
      const accessToken = await TokenService.createAccessToken(user);
      const payload = await jwt.verify(accessToken);
      expect(payload).toEqual({
        id: user.id,
        authType: authTypes.ACCESS,
      });
    });

    it('should throw an error if access token is invalid', async () => {
      const accessToken = await TokenService.createAccessToken(user);
      const invalidAccessToken = accessToken.replace('a', 'b');
      await expect(jwt.verify(invalidAccessToken)).rejects.toThrow(
        'invalid signature'
      );
    });

    it('should throw an error if user is missing', async () => {
      await expect(TokenService.createAccessToken(null)).rejects.toThrow(
        'TokenService:::User id not provided'
      );
    });

    it('should throw an error if user is not an object', async () => {
      await expect(TokenService.createAccessToken('test')).rejects.toThrow(
        'TokenService:::User id not provided'
      );
    });

    it('should throw an error if user does not have an id', async () => {
      await expect(TokenService.createAccessToken({})).rejects.toThrow(
        'TokenService:::User id not provided'
      );
    });

    it('should throw an error if user id is empty', async () => {
      await expect(TokenService.createAccessToken({ id: '' })).rejects.toThrow(
        'TokenService:::User id not provided'
      );
    });
  });

  describe('getSignedRefreshToken tests', () => {
    it('should create a valid refresh token', async () => {
      const refreshToken = await TokenService.getSignedRefreshToken({
        request: getMockRequest(),
        user,
      });

      const payload = await jwt.verify(refreshToken);
      expect(payload).toEqual({
        refreshTokenId: expect.any(String),
        authType: 'REFRESH',
      });

      const refreshTokenFromDatabase = await prisma.refreshTokens.findUnique({
        where: {
          id: payload.refreshTokenId,
        },
      });
      expect(refreshTokenFromDatabase).toEqual(
        expect.objectContaining({
          date: expect.any(Date),
          id: expect.any(String),
          ipAddress: expect.any(String),
          userAgent: expect.any(String),
          userId: user.id,
        })
      );
    });

    it('should throw an error if user is missing', async () => {
      await expect(
        TokenService.getSignedRefreshToken({
          request: getMockRequest(),
          user: null,
        })
      ).rejects.toThrow('TokenService:::User id not provided');
    });

    it('should throw an error if user is missing id', async () => {
      await expect(
        TokenService.getSignedRefreshToken({
          request: getMockRequest(),
          user: {},
        })
      ).rejects.toThrow('TokenService:::User id not provided');
    });

    it('should throw an error if user id is empty', async () => {
      await expect(
        TokenService.getSignedRefreshToken({
          request: getMockRequest(),
          user: { id: '' },
        })
      ).rejects.toThrow('TokenService:::User id not provided');
    });

    it('should throw an error if request is missing', async () => {
      await expect(
        TokenService.getSignedRefreshToken({
          request: null,
          user,
        })
      ).rejects.toThrow('TokenService:::Request not provided');
    });

    it('should throw an error if request is not an object', async () => {
      await expect(
        TokenService.getSignedRefreshToken({
          request: 'test',
          user,
        })
      ).rejects.toThrow('TokenService:::Request not provided');
    });

    it('should throw an error if request is empty', async () => {
      await expect(
        TokenService.getSignedRefreshToken({
          request: {},
          user,
        })
      ).rejects.toThrow('TokenService:::Request not provided');
    });
  });

  describe('extractRefreshToken tests', () => {
    it('should extract a valid refresh token', async () => {
      const refreshToken = await TokenService.getSignedRefreshToken({
        request: getMockRequest(),
        user,
      });

      const extractedRefreshToken = await TokenService.extractRefreshToken(
        refreshToken,
        getMockRequest()
      );

      expect(extractedRefreshToken).toEqual(
        expect.objectContaining({
          date: expect.any(Date),
          id: expect.any(String),
          ipAddress: expect.any(String),
          userAgent: expect.any(String),
          userId: user.id,
        })
      );
    });

    it('should throw an error if refresh token is invalid', async () => {
      const refreshToken = await TokenService.getSignedRefreshToken({
        request: getMockRequest(),
        user,
      });

      const invalidRefreshToken = refreshToken.replace('a', 'b');

      await expect(
        TokenService.extractRefreshToken(invalidRefreshToken, getMockRequest())
      ).rejects.toThrow('invalid signature');
    });

    it('should throw an error if refresh token is missing', async () => {
      await expect(
        TokenService.extractRefreshToken(null, getMockRequest())
      ).rejects.toThrow('TokenService:::Refresh token not provided');
    });

    it('should throw an error if refresh token is not a string', async () => {
      await expect(
        TokenService.extractRefreshToken({}, getMockRequest())
      ).rejects.toThrow('TokenService:::Refresh token not provided');
    });

    it('should throw an error if refresh token is empty', async () => {
      await expect(
        TokenService.extractRefreshToken('', getMockRequest())
      ).rejects.toThrow('TokenService:::Refresh token not provided');
    });

    it('should throw an error if refresh token is not a valid refresh token', async () => {
      await expect(
        TokenService.extractRefreshToken('test', getMockRequest())
      ).rejects.toThrow('jwt malformed');
    });

    it('should throw an error if refresh token is not found in database', async () => {
      const refreshToken = await TokenService.getSignedRefreshToken({
        request: getMockRequest(),
        user,
      });

      await prisma.refreshTokens.delete({
        where: {
          id: refreshToken.id,
        },
      });

      await expect(
        TokenService.extractRefreshToken(refreshToken, getMockRequest())
      ).rejects.toThrow('Refresh token not found');
    });
  });
});

function getMockRequest() {
  return {
    headers: {
      'x-forwarded-for': 'forward-test',
      'user-agent': 'agent-test',
    },
    socket: {
      remoteAddress: 'address-test',
    },
  };
}
