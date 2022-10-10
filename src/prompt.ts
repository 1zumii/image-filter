import { prompt } from 'enquirer';

export const getInputPath = async (): Promise<string> => {
  const { path } = await prompt<{path: string}>({
    name: 'path',
    type: 'input',
    message: 'Enter the path of pictures that want to process',
  });

  return path;
};

export const getXXX = async (): Promise<void> => {
  // TODO
};
