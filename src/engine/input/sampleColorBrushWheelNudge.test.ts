import { describe, expect, it } from 'vitest';
import { sampleColorBrushWheelNudgeDeltaSteps } from './sampleColorBrushWheelNudge';

function wheel(
  partial: Partial<Pick<WheelEvent, 'altKey' | 'shiftKey' | 'ctrlKey' | 'deltaX' | 'deltaY'>>,
): Pick<WheelEvent, 'altKey' | 'shiftKey' | 'ctrlKey' | 'deltaX' | 'deltaY'> {
  return {
    altKey: false,
    shiftKey: false,
    ctrlKey: false,
    deltaX: 0,
    deltaY: 0,
    ...partial,
  };
}

describe('sampleColorBrushWheelNudgeDeltaSteps', () => {
  it('returns null when another tool is active', () => {
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ altKey: true, deltaY: 100 }), 'pan')).toBeNull();
  });

  it('returns null without alt or shift', () => {
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ deltaY: 100 }), 'sample-color')).toBeNull();
  });

  it('returns null with ctrl (pinch / zoom chord) so zoom can run', () => {
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ altKey: true, ctrlKey: true, deltaY: 100 }), 'sample-color')).toBeNull();
  });

  it('alt + scroll down (positive deltaY) decreases brush (negative steps)', () => {
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ altKey: true, deltaY: 100 }), 'sample-color')).toBe(-1);
  });

  it('alt + scroll up decreases deltaY: increases brush', () => {
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ altKey: true, deltaY: -100 }), 'sample-color')).toBe(1);
  });

  it('shift matches alt sensitivity (same divisor)', () => {
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ shiftKey: true, deltaY: 100 }), 'sample-color')).toBe(-1);
  });

  it('shift + vertical wheel reported as horizontal delta (macOS) still nudges', () => {
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ shiftKey: true, deltaX: 100, deltaY: 0 }), 'sample-color')).toBe(-1);
  });

  it('alt+shift with horizontal delta matches single-line step size', () => {
    expect(
      sampleColorBrushWheelNudgeDeltaSteps(wheel({ altKey: true, shiftKey: true, deltaX: 100, deltaY: 0 }), 'sample-color'),
    ).toBe(-1);
  });

  it('multi-line notch: alt and shift both scale with delta (no extra shift multiplier)', () => {
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ altKey: true, deltaY: 300 }), 'sample-color')).toBe(-3);
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ shiftKey: true, deltaY: 300 }), 'sample-color')).toBe(-3);
  });

  it('small non-zero delta still nudges one step', () => {
    expect(sampleColorBrushWheelNudgeDeltaSteps(wheel({ altKey: true, deltaY: 40 }), 'sample-color')).toBe(-1);
  });
});
