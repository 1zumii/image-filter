import fs from 'fs/promises';
import os from 'os';

/**
 * 将相对 home 目录的路径，转化成绝对路径
 */
export const validatePathForHomeDir = (path: string): string => {
  if (!path.startsWith('~')) {
    return path;
  }
  return `${os.homedir()}${path.slice(1)}`;
};

/**
 * 递归获取所有匹配类型的文件
 */
export const getAllFiles = async (dirPath: string, fileType?: string | string[]): Promise<void> => {
  const dir = await fs.opendir(dirPath);
  // eslint-disable-next-line no-restricted-syntax
  for await (const dirent of dir) {
    console.log(dirent.name);
  }
};
