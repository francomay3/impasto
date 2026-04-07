export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function srgbToLinear(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b);
  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) / 1.00000;
  const z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

export function labMidpoint(
  lab1: [number, number, number],
  lab2: [number, number, number]
): [number, number, number] {
  return [(lab1[0] + lab2[0]) / 2, (lab1[1] + lab2[1]) / 2, (lab1[2] + lab2[2]) / 2];
}

export function deltaELab(
  lab1: [number, number, number],
  lab2: [number, number, number]
): number {
  const dl = lab1[0] - lab2[0], da = lab1[1] - lab2[1], db = lab1[2] - lab2[2];
  return Math.sqrt(dl * dl + da * da + db * db);
}

export function normalizeHex(hex: string): string {
  const h = hex.replace('#', '');
  return '#' + (h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6));
}

export function isUsableColor(hex: string): boolean {
  const v = parseInt(hex.replace('#', ''), 16);
  const r = ((v >> 16) & 0xff) / 255;
  const g = ((v >> 8) & 0xff) / 255;
  const b = (v & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  return l >= 0.1 && l <= 0.85 && s >= 0.15;
}

export function getPixelHex(canvas: HTMLCanvasElement, clientX: number, clientY: number): string | null {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const px = Math.round(x * (canvas.width / rect.width));
  const py = Math.round(y * (canvas.height / rect.height));
  const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
  return rgbToHex(r, g, b);
}
