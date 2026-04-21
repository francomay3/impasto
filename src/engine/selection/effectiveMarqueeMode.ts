export type MarqueeUiMode = 'replace' | 'add' | 'subtract';

/** Toolbar mode plus modifier-only modes resolved at commit time. */
export type MarqueeCommitMode = MarqueeUiMode | 'invert';

export type PointerModifierBits = {
  readonly shiftKey: boolean;
  readonly altKey: boolean;
};

/**
 * Marquee commit mode from toolbar mode + pointer modifiers.
 *
 * - **Alt:** subtract (remove every hit id from the selection).
 * - **Shift:** invert **within the marquee** only: each hit id is toggled (selected → removed, unselected → added);
 *   pins outside the rect keep their prior selection state.
 * - Otherwise the toolbar **uiMode** applies (replace / add / subtract).
 */
export function effectiveMarqueeMode(uiMode: MarqueeUiMode, m: PointerModifierBits): MarqueeCommitMode {
  if (m.altKey) {
    return 'subtract';
  }
  if (m.shiftKey) {
    return 'invert';
  }
  return uiMode;
}
