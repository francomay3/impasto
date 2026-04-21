import type { ColorPin } from './colorPinTypes';

type RepositionUpdate = {
  readonly id: string;
  readonly imageX: number;
  readonly imageY: number;
  readonly color: string;
};

/** Returns a new pin array if anything changed, or `null` if all values were already equal. */
export function applyRepositionMany(
  pins: readonly ColorPin[],
  updates: readonly RepositionUpdate[]
): readonly ColorPin[] | null {
  if (updates.length === 0) return null;
  const byId = new Map<string, RepositionUpdate>();
  for (const u of updates) byId.set(u.id, u);
  let changed = false;
  const next = pins.map((p) => {
    const u = byId.get(p.id);
    if (!u) return p;
    if (u.imageX === p.imageX && u.imageY === p.imageY && u.color === p.color) return p;
    changed = true;
    return Object.freeze({ ...p, imageX: u.imageX, imageY: u.imageY, color: u.color });
  });
  return changed ? next : null;
}

/** Returns a frozen-row replacement array, or `null` if the content is identical to `existing`. */
export function applySetAllPins(
  existing: readonly ColorPin[],
  next: readonly ColorPin[]
): readonly ColorPin[] | null {
  // Omit optional fields when unset so snapshots stay Firestore-safe (setDoc rejects `undefined` anywhere nested).
  const mapped = next.map((p) =>
    Object.freeze({
      id: p.id,
      imageX: p.imageX,
      imageY: p.imageY,
      radiusPx: p.radiusPx,
      color: p.color,
      ...(p.label !== undefined ? { label: p.label } : {}),
      ...(p.groupId !== undefined ? { groupId: p.groupId } : {}),
    } as ColorPin)
  );
  if (mapped.length === existing.length) {
    let same = true;
    for (let i = 0; i < mapped.length; i += 1) {
      const a = mapped[i]!;
      const b = existing[i]!;
      if (
        a.id !== b.id ||
        a.imageX !== b.imageX ||
        a.imageY !== b.imageY ||
        a.radiusPx !== b.radiusPx ||
        a.color !== b.color ||
        a.label !== b.label ||
        a.groupId !== b.groupId
      ) {
        same = false;
        break;
      }
    }
    if (same) return null;
  }
  return mapped;
}

/** Returns updated pin array if the target pin's metadata changed, or `null` if nothing changed. */
export function applySetPinMeta(
  pins: readonly ColorPin[],
  id: string,
  meta: { label?: string; groupId?: string | null }
): readonly ColorPin[] | null {
  let changed = false;
  const next = pins.map((p) => {
    if (p.id !== id) return p;
    let nextLabel = p.label;
    if (meta.label !== undefined) nextLabel = meta.label;
    let nextGroupId = p.groupId;
    if (meta.groupId === null) {
      nextGroupId = undefined;
    } else if (meta.groupId !== undefined) {
      nextGroupId = meta.groupId;
    }
    const labelChanged = meta.label !== undefined && meta.label !== p.label;
    const groupChanged =
      meta.groupId === null
        ? p.groupId !== undefined
        : meta.groupId !== undefined && meta.groupId !== p.groupId;
    if (!labelChanged && !groupChanged) return p;
    changed = true;
    return Object.freeze({
      id: p.id,
      imageX: p.imageX,
      imageY: p.imageY,
      radiusPx: p.radiusPx,
      color: p.color,
      ...(nextLabel !== undefined ? { label: nextLabel } : {}),
      ...(nextGroupId !== undefined ? { groupId: nextGroupId } : {}),
    } as ColorPin);
  });
  return changed ? next : null;
}
