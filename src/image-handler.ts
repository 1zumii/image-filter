import { default as $path } from 'path';
import chalk from 'chalk';
import { default as $fs } from 'fs-extra';
import $ from 'sharp';
import { IMAGE_FILE_TYPES } from './constant';
import type { Ratio } from './constant';
import { getAllFilesRecursively, getValidDirectoryPath, transformToAbsolutePath } from './file-handler';
import { Params as ProcessorParams } from './prompt';
import { asyncArrayReduceSuccessively } from './utils/async-array-methods';
import log, { RETURN } from './utils/log';

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

  private inputPath: string;

  private getOutputPath: () => Promise<string>;

  private outputPath: string;

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
    const sourcePath = await this.getInputPath();
    this.inputPath = await getValidDirectoryPath(sourcePath);
    const imagePaths = await getAllFilesRecursively(this.inputPath, IMAGE_FILE_TYPES);

    return imagePaths.map<Image>((path) => {
      const data = $(path);
      const fileName = $path.basename(path);
      return { data, fileName };
    });
  };

  private writeImages = async (
    resultImages: Image[],
    onSuccess: (info: $.OutputInfo, image: Image) => void,
    onError: (reason: Error, image: Image) => void,
  ): Promise<number> => {
    if (this.inputPath === this.outputPath) {
      // TODO: double confirm prompt
    }
    await $fs.emptyDir(this.outputPath);

    const result = await Promise.allSettled(
      // fire promises to output image concurrently
      resultImages.map(
        async (image): Promise<void> => {
          const outputFilePath = $path.resolve(this.outputPath, image.fileName);
          try {
            const info = await image.data.toFile(outputFilePath);
            onSuccess(info, image);
          } catch (reason) {
            onError(reason, image);
          }
        },
      ),
    );

    return result
      .map((p) => p.status === 'fulfilled')
      .filter((e) => e)
      .length;
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

    // get all params
    const processorParams: ProcessorParams[] = await asyncArrayReduceSuccessively(
      this.processorMap.map(([prompt]) => prompt),
      async (prevResult, prompt) => {
        const params = await prompt();
        return [...prevResult, params];
      },
      [] as ProcessorParams[],
    );

    // get output path
    const sourceOutputPath = await this.getOutputPath();
    this.outputPath = transformToAbsolutePath(sourceOutputPath);

    // call all processor functions with corresponding params
    const resultImages: Image[] = await asyncArrayReduceSuccessively(
      this.processorMap.map(([_, processor]) => processor),
      async (prevResult, processor, index) => {
        const params = processorParams[index];
        return processor(prevResult, params);
      },
      originImages,
    );

    // eslint-disable-next-line no-console
    console.log('\n');
    // output images
    const successCount = await this.writeImages(
      resultImages,
      (info, image) => {
        const fileName = $path.basename(image.fileName);
        log.info(RETURN, chalk.bgGreen(' Done '), ' ', chalk.magentaBright(fileName), '\t=> ', chalk.cyan(`${info.width}×${info.height}`));
      },
      (reason, image) => {
        const fileName = $path.basename(image.fileName);
        log.error(RETURN, chalk.bgRedBright(' Failed '), ' ', chalk.magentaBright(fileName), '\n', reason, '\n');
      },
    );
    log.info(RETURN, chalk.bgGreen(' Done '), ' ', `${successCount} images`);
  };
}
