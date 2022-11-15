import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import asyncLoop from './utils/async-loop';

/**
 * 将相对 home 目录的路径，转化成绝对路径
 */
export const validatePathForHomeDir = (p: string): string => {
  if (!p.startsWith('~')) {
    return p;
  }
  return `${os.homedir()}${p.slice(1)}`;
};

/**
 * 转换出一个合法的目录路径
 */
export const getValidDirectoryPath = async (p: string): Promise<string> => {
  const validPath = validatePathForHomeDir(p.trim());
  const status = await fs.stat(validPath);
  if (!status.isDirectory()) {
    throw new Error(`${chalk.red('Path is not a directory: ')}${validPath}`);
  }
  return validPath;
};

/**
 * 递归获取所有匹配类型的文件
 */
export const getAllFilesRecursively = async (
  dirPath: string,
  fileType?: string | string[],
): Promise<string[]> => {
  const filterFileTypes = (
    Array.isArray(fileType) ? fileType : [fileType]
  ).map((ext) => (ext.startsWith('.') ? ext : `.${ext}`));
  const files = [];
  let directories = [dirPath];

  // BFS
  await asyncLoop(
    () => directories.length > 0,
    async () => {
      const nextDirectories = [];
      await Promise.all(
        directories.map(
          async (directoryPath) => {
            const dirContent = await fs.opendir(directoryPath);
            // eslint-disable-next-line no-restricted-syntax
            for await (const d of dirContent) {
              if (d.isFile() && filterFileTypes.includes(path.extname(d.name))) {
                files.push(path.resolve(directoryPath, d.name));
              }
              if (d.isDirectory()) {
                nextDirectories.push(path.resolve(directoryPath, d.name));
              }
            }
          },
        ),
      );
      directories = nextDirectories;
    },
  );

  return files;
};
