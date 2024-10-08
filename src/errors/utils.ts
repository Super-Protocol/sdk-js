import _ from 'lodash';

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  const allowedErrorProperties = ['message', 'stack'];
  if (_.isObject(error)) {
    for (const field of allowedErrorProperties) {
      const value = _.get(error, field);
      if (typeof value === 'string') {
        return value;
      }
    }
    return _.toString(error);
  }
  return `Unknown error`;
};
