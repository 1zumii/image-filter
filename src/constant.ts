/**
 * 图片类型
 */
export const IMAGE_FILE_TYPES = [
  'png',
  'jpg',
  'jpeg',
];

/**
 * [widthRatio, heightRatio]
 */
export type Ratio = [number, number];
export const RATIOS: Ratio[] = [
  // wide
  [16, 9], [16, 10],
  // ultra wide
  [21, 9], [32, 9], [48, 9],
  // portrait
  [9, 16], [10, 16], [9, 18],
  // square
  [1, 1], [3, 2], [4, 3], [5, 4],
];

export type Resolution = [
  'ultra-wide' | '16:9' | '16:10' | '4:3' | '5:4',
  { width: number; height: number }[]
]
export const RESOLUTIONS: Resolution[] = [
  [
    'ultra-wide',
    [[2560, 1080], [3440, 1440], [3840, 1600]],
  ],
  [
    '16:9',
    [[1280, 720], [1600, 900], [1920, 1080], [2560, 1440], [3840, 2160]],
  ],
  [
    '16:10',
    [[1280, 800], [1600, 1000], [1920, 1200], [2560, 1600], [3840, 2400]],
  ],
  [
    '4:3',
    [[1280, 960], [1600, 1200], [1920, 1440], [2560, 1920], [3840, 2880]],
  ],
  [
    '5:4',
    [[1280, 1024], [1600, 1280], [1920, 1536], [2560, 2048], [3840, 3072]],
  ],
].map(([name, list]) => ([
  name as Resolution[0],
  (list as [number, number][]).map(([width, height]) => ({ width, height })),
]));
