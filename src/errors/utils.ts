import { isObject, get, toString } from 'lodash';

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  const allowedErrorProperties = ['message', 'stack'];
  if (isObject(error)) {
    for (const field of allowedErrorProperties) {
      const value = get(error, field);
      if (typeof value === 'string') {
        return value;
      }
    }
    return toString(error);
  }
  return `Unknown error`;
};
