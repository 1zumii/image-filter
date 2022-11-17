import chalk from 'chalk';
import {
  cropImageByRatio, getImageResolution, Image, ImageProcessor,
} from './image-handler';
import {
  getInputPath, getOutputPath, getRatioCropParams, getResolutionFilterParams,
} from './prompt';
import { asyncArrayFilter } from './utils/async-array-methods';
import log from './utils/log';

const handleError = (error: Error): never => {
  log.error('\n', '👻', chalk.red('Opps!'), '\n', error.message ?? '', '\n');
  process.exit(1);
};
process.on('uncaughtException', handleError);

// main entry
ImageProcessor
  .create(
    getInputPath,
    getOutputPath,
  )
  .registerProcessor(
    getResolutionFilterParams,
    async (images, params) => {
      if (params.mode === 'off') return images;
      const result = await asyncArrayFilter(
        images,
        async (image) => {
          const { width, height } = await getImageResolution(image);
          return params.mode === 'at-least'
            ? width >= params.resolution.width && height >= params.resolution.height
            : width === params.resolution.width && height === params.resolution.height;
        },
      );
      return result;
    },
  )
  .registerProcessor(
    getRatioCropParams,
    async (images, params) => {
      if (params.mode === 'off') return images;
      const result = await Promise.allSettled(
        images.map((i) => cropImageByRatio(i, params.ratio)),
      );

      return result
        .map<Image | undefined>((p) => {
          if (p.status === 'rejected') {
            return undefined;
          }
          return p.value;
        })
        .filter((p) => !!p);
    },
  )
  .start();
