import { HOTKEYS, HOTKEY_META, type HotkeyRegistryKey, type ShortcutContext } from '../../hotkeys';

const CONTEXT_ORDER: readonly ShortcutContext[] = ['Global', 'Palette', 'Filters'];

const HOTKEY_ORDER = Object.keys(HOTKEYS) as HotkeyRegistryKey[];

/**
 * Merges {@link HOTKEY_META} aliasOf bindings into a single chord list per primary key
 * (primary chord first, then alias chords in `HOTKEYS` object insertion order).
 */
function mergedChordsByPrimary(): Map<HotkeyRegistryKey, string[]> {
  const m = new Map<HotkeyRegistryKey, string[]>();
  for (const k of HOTKEY_ORDER) {
    if (HOTKEY_META[k].aliasOf) continue;
    m.set(k, [HOTKEYS[k]]);
  }
  for (const k of HOTKEY_ORDER) {
    const target = HOTKEY_META[k].aliasOf;
    if (!target) continue;
    const list = m.get(target);
    if (list) list.push(HOTKEYS[k]);
  }
  return m;
}

function isRowDisplayWorthy(chords: string[]): boolean {
  return chords.length > 0 && chords.some((c) => c.trim().length > 0);
}

/**
 * All keyboard shortcuts for the help modal, grouped and sorted, with alias chords merged
 * into their primary row. Omits non-primary (alias) rows.
 */
export function buildShortcutRows(): Array<{
  context: ShortcutContext;
  rows: Array<{ action: string; chords: string[] }>;
}> {
  const byChord = mergedChordsByPrimary();
  const buckets: Record<ShortcutContext, Array<{ action: string; chords: string[] }>> = {
    Global: [],
    Palette: [],
    Filters: [],
  };

  for (const k of HOTKEY_ORDER) {
    if (HOTKEY_META[k].aliasOf) continue;
    const meta = HOTKEY_META[k];
    const chords = byChord.get(k) ?? [HOTKEYS[k]];
    if (!isRowDisplayWorthy(chords)) continue;
    buckets[meta.context].push({ action: meta.action, chords });
  }

  return CONTEXT_ORDER.map((context) => ({ context, rows: buckets[context] })).filter(
    (g) => g.rows.length > 0
  );
}
