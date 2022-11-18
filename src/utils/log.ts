/* eslint-disable no-console */

// https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_(Control_Sequence_Introducer)_sequences
export const RETURN = `\x1b[1A${' '.repeat(100)}\x1b[1G`;

const info = (...params: Parameters<Console['info']>): void => {
  console.log(...params);
};

const error = (...params: Parameters<Console['error']>): void => {
  console.log(...params);
};

export default { info, error };
