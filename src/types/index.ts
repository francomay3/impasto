export type ColorGroup = {
  id: string;
  name: string;
};

export type Color = {
  id: string;
  hex: string;
  name?: string;
  locked: boolean;
  ratio: number;
  mixRecipe: string;
  groupId?: string;
  highlighted?: boolean;
};

export type Pigment = {
  name: string;
  hex: string;
};

export type FilterType = 'brightness-contrast' | 'hue-saturation' | 'levels' | 'blur';

export type BrightnessContrastParams = { brightness: number; contrast: number };
export type HueSaturationParams = { saturation: number; temperature: number; tint: number };
export type LevelsParams = { blackPoint: number; whitePoint: number };
export type BlurParams = { blur: number };
export type FilterParams = BrightnessContrastParams | HueSaturationParams | LevelsParams | BlurParams;

export type FilterInstance = {
  id: string;
  type: FilterType;
  params: FilterParams;
};

export const DEFAULT_FILTER_PARAMS: Record<FilterType, FilterParams> = {
  'brightness-contrast': { brightness: 0, contrast: 0 },
  'hue-saturation': { saturation: 0, temperature: 0, tint: 0 },
  'levels': { blackPoint: 0, whitePoint: 255 },
  'blur': { blur: 0 },
};

export const FILTER_LABELS: Record<FilterType, string> = {
  'brightness-contrast': 'Brightness / Contrast',
  'hue-saturation': 'Hue / Saturation',
  'levels': 'Levels',
  'blur': 'Blur',
};

export type ProjectState = {
  id: string;
  name: string;
  imageDataUrl: string | null;
  imageStorageUrl?: string;
  palette: Color[];
  groups: ColorGroup[];
  paletteSize: number;
  filters: FilterInstance[];
  preIndexingBlur: number;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_PROJECT_STATE: ProjectState = {
  id: '',
  name: 'Untitled Project',
  imageDataUrl: null,
  palette: [],
  groups: [],
  paletteSize: 8,
  filters: [],
  preIndexingBlur: 3,
  createdAt: '',
  updatedAt: '',
};
