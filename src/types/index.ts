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

export type FilterSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  blur: number;
  blackPoint: number;
  whitePoint: number;
};

export type ProjectState = {
  id: string;
  name: string;
  imageDataUrl: string | null;
  palette: Color[];
  groups: ColorGroup[];
  paletteSize: number;
  filters: FilterSettings;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_FILTERS: FilterSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  blur: 0,
  blackPoint: 0,
  whitePoint: 255,
};

export const DEFAULT_PROJECT_STATE: ProjectState = {
  id: '',
  name: 'Untitled Project',
  imageDataUrl: null,
  palette: [],
  groups: [],
  paletteSize: 8,
  filters: DEFAULT_FILTERS,
  createdAt: '',
  updatedAt: '',
};
