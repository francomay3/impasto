type RgbArray = number[] & { toString(): string };

declare const mixbox: {
  LATENT_SIZE: number;
  rgbToLatent(r: number, g: number, b: number): number[];
  rgbToLatent(rgb: number[]): number[];
  latentToRgb(latent: number[]): RgbArray;
  lerp(color1: number[] | string, color2: number[] | string, t: number): RgbArray;
};

export default mixbox;
