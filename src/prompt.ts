import { prompt } from 'enquirer';
import {
  Ratio, RATIOS, Resolution, RESOLUTIONS,
} from './constant';

export const getInputPath = async (): Promise<string> => {
  const { path } = await prompt<{path: string}>({
    name: 'path',
    type: 'input',
    message: 'Enter the path of images that want to process',
  });

  return path;
};

export const getOutputPath = async (): Promise<string> => {
  const { path } = await prompt<{path: string}>({
    name: 'path',
    type: 'input',
    message: 'Enter the path of images that want to output',
  });

  return path;
};

type RatioCropParams = {
  mode: 'off';
} | {
  mode: 'crop';
  ratio: Ratio;
}

export const getRatioCropParams = async (): Promise<RatioCropParams> => {
  const { needCrop } = await prompt<{needCrop: boolean}>({
    type: 'confirm',
    name: 'needCrop',
    message: 'Need Crop images by exactly ratio',
    format: (e) => (e ? 'yes' : 'No'),
  });
  if (!needCrop) return { mode: 'off' };

  const { ratioToken } = await prompt<{ratioToken: string}>({
    type: 'autocomplete',
    name: 'ratioToken',
    message: 'Choose ratio',
    choices: RATIOS.map((r) => {
      const [wRatio, hRatio] = r;
      return `${wRatio}:${hRatio}`;
    }),
  });
  const ratio = ratioToken.split(':').map((i) => (i ? Number(i) : NaN));
  return ratio.length === 2 && ratio.every((i) => !Number.isNaN(i))
    ? { mode: 'crop', ratio: ratio as Ratio }
    : { mode: 'off' };
};

type ResolutionFilterParams = {
  mode: 'off';
} | {
  mode: 'at-least' | 'exactly';
  resolution: Resolution['1'][number];
}
export const getResolutionFilterParams = async (): Promise<ResolutionFilterParams> => {
  const { filterMode } = await prompt<{filterMode: ResolutionFilterParams['mode']}>({
    type: 'select',
    name: 'filterMode',
    message: 'Need filter images by limit resolution',
    choices: ['off', 'at-least', 'exactly'],
  });
  if (filterMode === 'off') return { mode: 'off' };

  const { resolutionToken } = await prompt<{resolutionToken: string}>({
    type: 'autocomplete',
    name: 'resolutionToken',
    message: 'Choose resolution',
    choices: RESOLUTIONS.map(([, rList]) => rList).flat().map((r) => {
      const { width, height } = r;
      return `${width}×${height}`;
    }),
  });
  const resolution = resolutionToken.split('×').map((i) => (i ? Number(i) : NaN));
  if (resolution.length !== 2 || resolution.some((i) => Number.isNaN(i))) return { mode: 'off' };

  const [width, height] = resolution;
  return { mode: filterMode, resolution: { width, height } };
};

export type Params = RatioCropParams | ResolutionFilterParams
