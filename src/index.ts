import fs from 'fs/promises';
import chalk from 'chalk';
import { validatePathForHomeDir } from './file-util';

const $mockInput = '~/about/temporary';

// main entry
const sourcePath = validatePathForHomeDir($mockInput);

fs.stat(sourcePath)
  .then((status) => {
    if (!status.isDirectory()) {
      throw new Error();
    }
    console.log(chalk.green(sourcePath));
  })
  .catch(() => {
    console.error(chalk.red('Path is not a directory: '), sourcePath);
    process.exit(1);
  });
