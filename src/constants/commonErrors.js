/* eslint-disable max-classes-per-file */
/**
 * ArchivedError to be used when request
 * to update or get information about a resource
 * is done on a resource that is archived.
 */
export class ArchivedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ArchivedError';
    this.statusCode = 410;
  }
}
Object.freeze(ArchivedError.prototype);

/**
 * AuthenticationError to be used when request
 * cannot be  authenticated or identified.
 * Can be due to malformed tokens, expired JWTs,
 * or otherwise unverifiable information.
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}
Object.freeze(AuthenticationError.prototype);

/**
 * AuthorizationError to be used when request
 * is not authorized. **NOTE**: Only use when request
 * was correctly authetenticated (user was identified)
 * but that user does not have permission/access to
 * requested resources/endpoints/actions.
 */
export class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}
Object.freeze(AuthorizationError.prototype);

/**
 * RequestError to be used when request
 * has reached a valid endpoint, but it
 * is malformed, incorrect, or missing information.
 * Should **not** be used for missing authentication
 * information --> in that case, use AuthenticationError
 * instead.
 */
export class RequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RequestError';
    this.statusCode = 400;
  }
}
Object.freeze(RequestError.prototype);

/**
 * ValidationError to be used when request
 * needs to validate fields but those fields
 * do not match up with what is expected
 * for the request to be completed.
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 403;
  }
}
Object.freeze(ValidationError.prototype);
