import type { SelectionEntry } from './SelectionState';
import type { MarqueeCommitMode } from './effectiveMarqueeMode';
import { colorPinEntry } from './selectionEntries';

function applyReplace(hitIds: readonly string[]): SelectionEntry[] {
  return hitIds.map(colorPinEntry);
}

function applyAdd(prev: readonly SelectionEntry[], hitIds: readonly string[]): SelectionEntry[] {
  const prevIds = new Set<string>();
  const out: SelectionEntry[] = [];
  for (const e of prev) {
    if (e.kind === 'colorPin') {
      prevIds.add(e.id);
      out.push(e);
    }
  }
  for (const id of hitIds) {
    if (!prevIds.has(id)) {
      prevIds.add(id);
      out.push(colorPinEntry(id));
    }
  }
  return out;
}

function applySubtract(prev: readonly SelectionEntry[], hitSet: Set<string>): SelectionEntry[] {
  return prev.filter((e) => e.kind !== 'colorPin' || !hitSet.has(e.id));
}

function applyInvert(prev: readonly SelectionEntry[], hitIds: readonly string[], hitSet: Set<string>): SelectionEntry[] {
  const prevPinIds = new Set(prev.filter((e) => e.kind === 'colorPin').map((e) => e.id));
  const out: SelectionEntry[] = [];
  for (const e of prev) {
    if (e.kind === 'colorPin' && hitSet.has(e.id)) {
      continue;
    }
    out.push(e);
  }
  for (const id of hitIds) {
    if (!prevPinIds.has(id)) {
      out.push(colorPinEntry(id));
    }
  }
  return out;
}

/**
 * Applies marquee hit ids to the previous selection.
 * - replace: selection becomes hits in `hitIds` order (stable scan order from caller).
 * - add: union; prior order preserved, then new ids appended in `hitIds` order.
 * - subtract: prior entries minus any id in `hitIds`.
 * - invert: only ids in `hitIds` are toggled; other selection entries (including color pins outside the rect) unchanged.
 */
export function applyMarqueeSelection(
  prev: readonly SelectionEntry[],
  hitIds: readonly string[],
  mode: MarqueeCommitMode,
): SelectionEntry[] {
  const hitSet = new Set(hitIds);
  switch (mode) {
    case 'replace':
      return applyReplace(hitIds);
    case 'add':
      return applyAdd(prev, hitIds);
    case 'subtract':
      return applySubtract(prev, hitSet);
    case 'invert':
      return applyInvert(prev, hitIds, hitSet);
  }
}
