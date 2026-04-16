import type { ToolConfigNumberParam } from './toolConfigParams';

export function clampNumber(raw: unknown, min: number, max: number, step: number): number {
  let n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    n = min;
  }
  n = Math.min(max, Math.max(min, n));
  const steps = Math.round((n - min) / step);
  return min + steps * step;
}

export function materializeNumberParam(
  schema: Omit<ToolConfigNumberParam, 'kind' | 'value'>,
  value: number,
): ToolConfigNumberParam {
  return {
    kind: 'number',
    ...schema,
    value: clampNumber(value, schema.min, schema.max, schema.step),
  };
}
