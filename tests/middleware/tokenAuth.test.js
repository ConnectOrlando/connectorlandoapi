import tokenAuth from '../../src/middleware/tokenAuth.js';
import { jest } from '@jest/globals';

describe('tokenAuth', () => {
  it('should return a 401 if no authorization header is present', () => {
    const mockedRequest = createRequestWithAuthorizationHeader();
    const mockedResponse = mockResponse();
    const mockedNext = jest.fn();

    tokenAuth(mockedRequest, mockedResponse, mockedNext);

    expect(mockedNext.mock.calls.length).toBe(1);
    expect(mockedResponse.status).toHaveBeenCalledWith(401);
    expect(mockedResponse.json).toHaveBeenCalledWith({
      error: 'Access token missing',
    });
  });
});

function createRequestWithAuthorizationHeader(token) {
  return {
    headers: {
      authorization: token || '',
    },
  };
}

function mockResponse() {
  return {
    status: jest.fn().mockReturnValue(null),
    json: jest.fn().mockReturnValue(null),
  };
}
