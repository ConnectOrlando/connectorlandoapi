import * as CommonErrors from '../constants/commonErrors.js';
import Logger from '../tools/logger.js';

const ALLOWED_ERRORS = new Set(['ValidationError']);

export default (error, request, res, next) => {
  if (error) {
    let { name, message, statusCode } = error;
    if (error.name === 'TokenExpiredError') {
      statusCode = 401;
    } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      name = 'PostBodyError';
      statusCode = 400;
      message = 'Post body must be valid JSON';
    } else if (ALLOWED_ERRORS.has(error.name)) {
      statusCode = 500;
    } else if (!checkIfCommonError(error)) {
      statusCode = 500;
      name = 'Internal Server Error';
      message = 'See API logs for more info';
      Logger.error(error);
    }
    res.status(statusCode || 500).json({
      error: { name, message },
    });
  } else {
    next();
  }
};

function checkIfCommonError(error) {
  let isCommonError = false;
  const commonErrorKeys = Object.keys(CommonErrors);
  for (let index = 0; index < Object.keys(CommonErrors).length; index += 1) {
    const ErrorType = commonErrorKeys[index];
    if (error instanceof CommonErrors[ErrorType]) {
      isCommonError = true;
      break;
    }
  }
  return isCommonError;
}
