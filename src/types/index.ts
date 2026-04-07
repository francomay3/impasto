export type ColorGroup = {
  id: string;
  name: string;
};

export type ColorSample = {
  x: number;
  y: number;
  radius: number;
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Color = {
  id: string;
  hex: string;
  name?: string;
  locked: boolean;
  ratio: number;
  mixRecipe: string;
  groupId?: string;
  sample?: ColorSample;
};

export type Pigment = {
  name: string;
  rgb: string;
};

export type FilterType =
  | 'brightness-contrast'
  | 'hue-saturation'
  | 'white-balance'
  | 'vibrance'
  | 'color-balance'
  | 'levels'
  | 'blur';

export type BrightnessContrastParams = { brightness: number; contrast: number };
export type HueSaturationParams = { hue: number; saturation: number; lightness: number };
export type WhiteBalanceParams = { temperature: number; tint: number };
export type VibranceParams = { vibrance: number; saturation: number };
export type ColorBalanceParams = {
  shadowsR: number; shadowsG: number; shadowsB: number;
  midtonesR: number; midtonesG: number; midtonesB: number;
  highlightsR: number; highlightsG: number; highlightsB: number;
  preserveLuminosity: number; // 0 | 1
};
export type LevelsParams = { blackPoint: number; whitePoint: number };
export type BlurParams = { blur: number };
export type FilterParams =
  | BrightnessContrastParams
  | HueSaturationParams
  | WhiteBalanceParams
  | VibranceParams
  | ColorBalanceParams
  | LevelsParams
  | BlurParams;

export type FilterInstance = {
  id: string;
  type: FilterType;
  params: FilterParams;
  enabled?: boolean;
};

export const DEFAULT_FILTER_PARAMS: Record<FilterType, FilterParams> = {
  'brightness-contrast': { brightness: 0, contrast: 0 },
  'hue-saturation': { hue: 0, saturation: 0, lightness: 0 },
  'white-balance': { temperature: 0, tint: 0 },
  'vibrance': { vibrance: 0, saturation: 0 },
  'color-balance': {
    shadowsR: 0, shadowsG: 0, shadowsB: 0,
    midtonesR: 0, midtonesG: 0, midtonesB: 0,
    highlightsR: 0, highlightsG: 0, highlightsB: 0,
    preserveLuminosity: 1,
  },
  levels: { blackPoint: 0, whitePoint: 255 },
  blur: { blur: 0 },
};

export const FILTER_LABELS: Record<FilterType, string> = {
  'brightness-contrast': 'Brightness / Contrast',
  'hue-saturation': 'Hue / Saturation / Lightness',
  'white-balance': 'White Balance',
  'vibrance': 'Vibrance',
  'color-balance': 'Color Balance',
  levels: 'Levels',
  blur: 'Blur',
};

export type RawImage = {
  data: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
};

// Creates a RawImage with `data` non-enumerable so React DevTools does not
// try to walk the Uint8ClampedArray's 12M+ indexed properties on every commit.
export function createRawImage(
  data: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number
): RawImage {
  const img = { width, height } as RawImage;
  Object.defineProperty(img, 'data', {
    value: data,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return img;
}

export type ProjectState = {
  id: string;
  name: string;
  imageStorageUrl?: string;
  palette: Color[];
  groups: ColorGroup[];
  paletteSize: number;
  filters: FilterInstance[];
  preIndexingBlur: number;
  // Cached hex colors for dashboard thumbnail generation only — not for use elsewhere.
  thumbnailColors?: string[];
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_PROJECT_STATE: ProjectState = {
  id: '',
  name: 'Untitled Project',
  palette: [],
  groups: [],
  paletteSize: 8,
  filters: [],
  preIndexingBlur: 3,
  createdAt: '',
  updatedAt: '',
};
