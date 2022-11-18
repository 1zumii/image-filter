/* eslint-disable no-console */
const info = (...params: Parameters<Console['info']>): void => {
  console.log(...params);
};

const error = (...params: Parameters<Console['error']>): void => {
  console.log(...params);
};

export default { info, error };
