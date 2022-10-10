import $ from 'jimp';

export const getImageInfo = async (path: string): Promise<void> => {
  const image = await $.read(path);
  const { height, width } = image.bitmap;
  console.log({ path, height, width });
};

export const cropImageByRatio = (): void => {
  // TODO
};
