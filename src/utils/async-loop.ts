enum AsyncLoopNextStatus {
  BREAK = 'break',
  CONTINUE = 'continue'
}

const breakAsyncLoop = () => {
  throw new Error(AsyncLoopNextStatus.BREAK);
};

const continueAsyncLoop = () => {
  throw new Error(AsyncLoopNextStatus.CONTINUE);
};

/**
 * while loop 的 async 形式，
 * 每一次迭代都是一个 async function。
 */
const asyncLoop = async (
  condition: () => boolean,
  iterate: (
    breakLoop: () => void,
    continueLoop: () => void
  ) => Promise<void>,
): Promise<void> => {
  if (!condition()) return Promise.resolve();

  try {
    await iterate(breakAsyncLoop, continueAsyncLoop);
  } catch (e) {
    if (e.message === AsyncLoopNextStatus.BREAK) {
      return Promise.resolve();
    }
    if (e.message === AsyncLoopNextStatus.CONTINUE) {
      return asyncLoop(condition, iterate);
    }
    throw e;
  }

  return asyncLoop(condition, iterate);
};

export default asyncLoop;
