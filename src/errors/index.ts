import { getErrorMessage } from './utils.js';

export class BaseError extends Error {
  constructor(error: unknown) {
    const message = getErrorMessage(error);
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      throw new Error('captureStackTrace does not exist');
    }
  }
}

export { NotFoundError } from './not-found.error.js';
