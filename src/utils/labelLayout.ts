const LABEL_H = 20;
const GAP = 3;
const CHAR_W = 7;    // approx monospace char width at 11px
const H_PAD = 14;    // total horizontal padding (7px each side)

export function estimateLabelWidth(text: string): number {
  return text.length * CHAR_W + H_PAD;
}

export interface LabelPin {
  px: number;
  py: number;
  labelWidth: number;
}

/** Returns a Y offset per label so that no two labels overlap. */
export function resolveLabelOffsets(pins: LabelPin[], dotR: number): number[] {
  const labelX = (i: number) => pins[i].px + dotR + 6;
  const offsets = pins.map(() => -LABEL_H / 2);

  for (let iter = 0; iter < 30; iter++) {
    let changed = false;
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const ax = labelX(i), ay = pins[i].py + offsets[i];
        const bx = labelX(j), by = pins[j].py + offsets[j];
        const xOverlap = ax < bx + pins[j].labelWidth && ax + pins[i].labelWidth > bx;
        const yOverlap = ay < by + LABEL_H + GAP && ay + LABEL_H + GAP > by;
        if (!xOverlap || !yOverlap) continue;

        const midA = pins[i].py + offsets[i] + LABEL_H / 2;
        const midB = pins[j].py + offsets[j] + LABEL_H / 2;
        const d = midA - midB;
        const push = (LABEL_H + GAP - Math.abs(d)) / 2 + 1;
        offsets[i] += d >= 0 ? push : -push;
        offsets[j] += d >= 0 ? -push : push;
        changed = true;
      }
    }
    if (!changed) break;
  }

  return offsets;
}
