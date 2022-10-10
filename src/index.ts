import fs from 'fs/promises';
import chalk from 'chalk';
import { IMAGE_FILE_TYPES } from './constant';
import { getAllFilesRecursively, validatePathForHomeDir } from './file-handler';
import { getImageInfo } from './image-handler';
import { getInputPath } from './prompt';
import log from './utils/log';

// main entry
(async (): Promise<void> => {
  try {
    const inputPath = await getInputPath();
    const sourcePath = validatePathForHomeDir(inputPath);
    const status = await fs.stat(sourcePath);
    if (!status.isDirectory()) {
      throw new Error(`${chalk.red('Path is not a directory: ')}${sourcePath}`);
    }

    console.time('image');
    const images = await getAllFilesRecursively(sourcePath, IMAGE_FILE_TYPES);
    console.log(images.length);
    console.timeEnd('image');

    // TODO: Temp test
    getImageInfo(images[0]);
  } catch (reason) {
    log.error('👻', chalk.red('Opps!'), '\n', reason.message ?? '', '\n');
    process.exit(1);
  }
})();
