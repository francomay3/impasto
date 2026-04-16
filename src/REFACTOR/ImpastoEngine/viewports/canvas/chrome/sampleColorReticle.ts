import { SAMPLE_COLOR_RETICLE_HALF_GAP } from '../../../infra/engineConstants';

/**
 * Draws a zoom-aware sample ring in **backing-store pixel space**.
 * Caller must leave the context in identity transform (see {@link ViewportCanvasBase} overlay pass).
 */
export function drawSampleColorReticle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  ringRadiusDevicePx: number,
): void {
  const R = Math.max(0.5, ringRadiusDevicePx);
  /** Half-gap between the two strokes so reads as two rings, not one thick band. */
  const halfGap = SAMPLE_COLOR_RETICLE_HALF_GAP;
  const outerR = R + halfGap;
  const innerR = Math.max(0.5, R - halfGap);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 1;

  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
