import chalk from 'chalk';
import { cropImageByRatio, Image, ImageProcessor } from './image-handler';
import {
  getInputPath, getOutputPath, getRatioCropParams, getResolutionFilterParams,
} from './prompt';
import log from './utils/log';

// main entry
(async (): Promise<void> => {
  try {
    ImageProcessor
      .create(
        getInputPath,
        getOutputPath,
      )
      .registerProcessor(
        getResolutionFilterParams,
        async (images, params) => {
          console.log({ params });
          return images;
        },
      )
      .registerProcessor(
        getRatioCropParams,
        async (images, params) => {
          if (params.mode === 'off') return images;
          const result = await Promise.allSettled(
            images.map((i) => cropImageByRatio(i, params.ratio)),
          );

          // TODO: temp log for debug
          console.log(chalk.bgCyan('process ratio crop done'));

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
  } catch (reason) {
    log.error('👻', chalk.red('Opps!'), '\n', reason.message ?? '', '\n');
    process.exit(1);
  }
})();
