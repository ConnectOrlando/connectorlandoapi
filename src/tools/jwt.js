import jwt from 'jsonwebtoken';
import config from '../config.js';

/**
 * Wrapper for jsonwebtoken sign function. Takes care of privateKey
 * @param {Object} data - data to be encoded in token
 * @param {String|Number}  [expiration="15min"] - from jsonwebtoken expiresIn arg. Defaults to '15min'
 * @return {JsonWebToken} token
 */
export function sign(data, expiration = '15min') {
  return jwt.sign(
    {
      data,
    },
    config.JWT_SECRET,
    { expiresIn: expiration }
  );
}

/**
 * Wrapper for jsonwebtoken verify function. Takes care of private key and promisifies.
 * @param {JsonWebToken} token - signed token, retrieve from sign function in same module
 * @return {Promise<any>} parsed token data
 */
export async function verify(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.JWT_SECRET, (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(data?.data);
    });
  });
}

export default {
  sign,
  verify,
};
