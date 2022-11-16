import { default as $path } from 'path';
import chalk from 'chalk';
import $ from 'sharp';
import { IMAGE_FILE_TYPES } from './constant';
import type { Ratio } from './constant';
import { getAllFilesRecursively, getValidDirectoryPath } from './file-handler';
import type { Params as ProcessorParams } from './prompt';
import { asyncArrayReduceSuccessively } from './utils/async-array-methods';

export type Image = {
  fileName: string;
  data: $.Sharp;
}
type Resolution = Required<Pick<$.Metadata, 'width' | 'height'>>

const maxCommonDivisor = (a: number, b: number): number => {
  const x = Math.max(a, b);
  const y = Math.min(a, b);

  if (x % y === 0) return y;
  return maxCommonDivisor(y, x % y);
};

// calculate maximal width and height of image that satisfy exact ratio, and sides are integer
const calcMaxImageSizeByRatio = (resolution: Resolution, ratio: Ratio): Resolution => {
  const [wRatio, hRatio] = ratio;
  const unitLength = Math.min(
    Math.floor(resolution.width / wRatio),
    Math.floor(resolution.height / hRatio),
  );
  return { width: unitLength * wRatio, height: unitLength * hRatio };
};

export const getImageResolution = async (image: Image): Promise<Resolution> => {
  const { width, height } = await image.data.metadata();
  return { width, height };
};

export const getImageRatio = async (image: Image): Promise<Ratio> => {
  const { width, height } = await image.data.metadata();
  const common = maxCommonDivisor(height, width);
  return [width / common, height / common];
};

export const cropImageByRatio = async (image: Image, ratio: Ratio): Promise<Image> => {
  const resolution = await getImageResolution(image);
  const { width: nextWidth, height: nextHeight } = calcMaxImageSizeByRatio(resolution, ratio);

  return {
    fileName: image.fileName,
    data: image.data.resize(nextWidth, nextHeight),
  };
};

type ProcessorMap<Params = ProcessorParams> = [
  () => Promise<Params>,
  (images: Image[], params: Params) => Promise<Image[]>
]

export class ImageProcessor {
  private processorMap: ProcessorMap[] = [];

  private getInputPath: () => Promise<string>;

  private getOutputPath: () => Promise<string>;

  constructor(
    getInputPath: () => Promise<string>,
    getOutputPath: () => Promise<string>,
  ) {
    this.getInputPath = getInputPath;
    this.getOutputPath = getOutputPath;
  }

  static create = (
    ...params: ConstructorParameters<typeof ImageProcessor>
  ) => new ImageProcessor(...params);

  private readImages = async (): Promise<Image[]> => {
    const inputPath = await this.getInputPath();
    const sourcePath = await getValidDirectoryPath(inputPath);
    const imagePaths = await getAllFilesRecursively(sourcePath, IMAGE_FILE_TYPES);

    return imagePaths.map<Image>((path) => {
      const data = $(path);
      const fileName = $path.basename(path);
      return { data, fileName };
    });
  };

  registerProcessor = <Params extends ProcessorParams>(
    prompt: () => Promise<Params>,
    processor: (images: Image[], params: Params) => Promise<Image[]>,
  ) => {
    this.processorMap.push([prompt, processor]);
    return this;
  };

  start = async (): Promise<void> => {
    const originImages = await this.readImages();

    // DEBUG: temp log
    console.log('start', originImages.length);

    // get all params
    const processorParams: ProcessorParams[] = await asyncArrayReduceSuccessively(
      this.processorMap.map(([prompt]) => prompt),
      async (prevResult, prompt) => {
        const params = await prompt();
        return [...prevResult, params];
      },
      [] as ProcessorParams[],
    );

    // call all processor functions with corresponding params
    const resultImages: Image[] = await asyncArrayReduceSuccessively(
      this.processorMap.map(([_, processor]) => processor),
      async (prevResult, processor, index) => {
        const params = processorParams[index];
        return processor(prevResult, params);
      },
      originImages,
    );

    // DEBUG: temp log
    console.log('end', resultImages.length);
    resultImages.forEach(async (image, index) => {
      const originImageResolution = await getImageResolution(originImages[index]);
      const { info } = await image.data.toBuffer({ resolveWithObject: true });
      const { width, height } = info;
      const common = maxCommonDivisor(height, width);
      console.log(
        chalk.cyan(`${originImageResolution.width}×${originImageResolution.height}`),
        '\t',
        '=>',
        '\t',
        chalk.green(`${width}×${height}`),
        '\t',
        `${width / common}:${height / common}`,
        '\t\t',
        chalk.magentaBright(image.fileName),
      );
    });
  };
}
