export function clampToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  margin = 8
): { left: number; top: number } {
  return {
    left: Math.min(x, window.innerWidth - width - margin),
    top: Math.min(y, window.innerHeight - height - margin),
  };
}
