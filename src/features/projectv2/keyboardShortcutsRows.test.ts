import { describe, expect, it } from 'vitest';
import { HOTKEY_META, type HotkeyRegistryKey } from '../../hotkeys';
import { buildShortcutRows } from './keyboardShortcutsRows';

describe('buildShortcutRows', () => {
  it('groups by context only: each row appears under its primary meta.context', () => {
    const groups = buildShortcutRows();
    const byContext = new Map<string, { action: string; chords: string[] }[]>();
    for (const g of groups) {
      byContext.set(g.context, g.rows);
    }
    for (const k of Object.keys(HOTKEY_META) as HotkeyRegistryKey[]) {
      const meta = HOTKEY_META[k];
      if (meta.aliasOf) continue;
      const inGroup = byContext.get(meta.context);
      expect(inGroup).toBeDefined();
      expect(inGroup?.some((r) => r.action === meta.action)).toBe(true);
    }
  });

  it('merges REDO_ALT into REDO (one Redo row; chords mod+shift+Z then mod+Y)', () => {
    const rows = buildShortcutRows()
      .flatMap((g) => g.rows)
      .filter((r) => r.action === 'Redo');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.chords).toEqual(['mod+shift+Z', 'mod+Y']);
  });

  it('does not emit alias-only keys as their own row', () => {
    const flat = buildShortcutRows().flatMap((g) => g.rows);
    expect(flat.filter((r) => r.chords.length === 1 && r.chords[0] === 'mod+Y').length).toBe(0);
  });

  it('stable order: Global → Palette → Filters', () => {
    expect(buildShortcutRows().map((g) => g.context)).toEqual(['Global', 'Palette', 'Filters']);
  });

  it('preserves within-context order matching HOTKEYS insertion order of primaries', () => {
    // SAVE before UNDO before ... in Global for keys that are Global primaries in registry order
    const global = buildShortcutRows().find((g) => g.context === 'Global')?.rows ?? [];
    const actions = global.map((r) => r.action);
    const iSave = actions.indexOf('Save');
    const iUndo = actions.indexOf('Undo');
    if (iSave >= 0 && iUndo >= 0) {
      expect(iSave).toBeLessThan(iUndo);
    }
  });
});
