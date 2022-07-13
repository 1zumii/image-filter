/* eslint-disable no-console */
const error = (...params: Parameters<Console['error']>): void => {
  console.log(...params);
};

export default { error };
