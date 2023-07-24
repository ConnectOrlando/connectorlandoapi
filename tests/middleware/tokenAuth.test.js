import TokenAuth from '../../src/middleware/tokenAuth.js';
import { jest } from '@jest/globals';
import jwt from '../../src/tools/jwt.js';
import authTypes from '../../src/constants/authTypes.js';

describe('TokenAuth Tests', () => {
  it('should call next if the route is public', async () => {
    const mockedRequest = createRequestWithAuthorizationHeader(null, true);
    const mockedNext = jest.fn();

    await TokenAuth(mockedRequest, null, mockedNext);

    expect(mockedNext.mock.calls.length).toBe(1);
    const error = mockedNext.mock.calls[0][0];
    expect(error).toBeUndefined();
  });

  it('should set authorizedUser in request if the token is valid', async () => {
    const accessToken = jwt.sign(
      {
        id: '1',
        authType: authTypes.ACCESS,
      },
      '1w'
    );
    const mockedRequest = createRequestWithAuthorizationHeader(
      `Bearer ${accessToken}`
    );
    const mockedNext = jest.fn();

    await TokenAuth(mockedRequest, null, mockedNext);

    expect(mockedRequest.authorizedUser).toEqual({
      id: '1',
    });
  });

  it('should return error if token has no authType', async () => {
    const accessToken = jwt.sign(
      {
        id: '1',
      },
      '1w'
    );
    const mockedRequest = createRequestWithAuthorizationHeader(
      `Bearer ${accessToken}`
    );
    const mockedNext = jest.fn();

    await TokenAuth(mockedRequest, null, mockedNext);

    expect(mockedNext.mock.calls.length).toBe(1);
    const error = mockedNext.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe(
      'Invalid token type. Check permissions and try again'
    );
  });

  it('should return error if authType is not ACCESS_TOKEN', async () => {
    const accessToken = jwt.sign(
      {
        id: '1',
        authType: 'random',
      },
      '1w'
    );
    const mockedRequest = createRequestWithAuthorizationHeader(
      `Bearer ${accessToken}`
    );
    const mockedNext = jest.fn();

    await TokenAuth(mockedRequest, null, mockedNext);

    expect(mockedNext.mock.calls.length).toBe(1);
    const error = mockedNext.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe(
      'Invalid token type. Check permissions and try again'
    );
  });

  it('should return a 401 if no authorization header is present', async () => {
    const mockedRequest = createRequestWithAuthorizationHeader();
    const mockedNext = jest.fn();

    await TokenAuth(mockedRequest, null, mockedNext);

    expect(mockedNext.mock.calls.length).toBe(1);
    const error = mockedNext.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe(
      'Missing token. Check permissions and try again'
    );
  });

  it('should return a 401 if the authorization header is not formatted correctly', async () => {
    const mockedRequest = createRequestWithAuthorizationHeader('invalid');
    const mockedNext = jest.fn();

    await TokenAuth(mockedRequest, null, mockedNext);

    expect(mockedNext.mock.calls.length).toBe(1);
    const error = mockedNext.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Token malformed. Fix and try again');
  });
});

function createRequestWithAuthorizationHeader(token, isPublicRoute = false) {
  return {
    isPublicRoute,
    headers: {
      authorization: token || '',
    },
    path: '/',
  };
}
