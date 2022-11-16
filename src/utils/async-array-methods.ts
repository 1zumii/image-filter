/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */

export const asyncArrayFilter = async <Item>(
  array: Item[],
  callback: (
    item: Item,
    index: number,
    thisArray: Item[],
  ) => Promise<boolean>,
): Promise<Item[]> => {
  // TODO: use Promise.allSettled to filter concurrently
  const result: Item[] = [];

  for (let i = 0; i < array.length; i++) {
    const testResult = await callback(array[i], i, array);
    if (testResult) result.push(array[i]);
  }

  return result;
};

export const asyncArrayReduceSuccessively = async <Item, Result>(
  array: Item[],
  callback: (
    prevResult: Result,
    currentItem: Item,
    index: number,
    thisArray: Item[]
  ) => Promise<Result>,
  initialValue?: Result,
): Promise<Result> => {
  let result = initialValue;
  let i = initialValue ? 0 : 1;

  while (i < array.length) {
    result = await callback(result, array[i], i, array);
    i++;
  }

  return result;
};
