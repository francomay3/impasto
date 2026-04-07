import { findPinAt } from '../engine/hitTest';
import type { Color } from '../../../types';

type CanvasRect = { left: number; top: number; width: number; height: number };

export type SelectResult =
  | { type: 'select'; pinId: string; toggle: boolean }
  | { type: 'deselect_all' };

/**
 * Handles select-mode pointer logic: pin hit testing, click-to-select, and hover tracking.
 * Pure TS — no React, no store access.
 */
export class SelectController {
  private onSelectCallback: (result: SelectResult) => void;
  private onHoverCallback: ((pinId: string | null) => void) | undefined;
  private lastHoveredId: string | null = null;

  constructor(
    onSelect: (result: SelectResult) => void,
    onHover?: (pinId: string | null) => void,
  ) {
    this.onSelectCallback = onSelect;
    this.onHoverCallback = onHover;
  }

  /**
   * Call on click in select mode. Finds the pin at the click position and emits
   * a select or deselect_all result. modifierKey = shift or meta for toggle behaviour.
   */
  handleClick(
    cx: number,
    cy: number,
    pins: Color[],
    canvasRect: CanvasRect,
    imgW: number,
    imgH: number,
    modifierKey: boolean,
  ): void {
    const pinId = findPinAt(cx, cy, pins, canvasRect, imgW, imgH);
    if (pinId) {
      this.onSelectCallback({ type: 'select', pinId, toggle: modifierKey });
    } else {
      this.onSelectCallback({ type: 'deselect_all' });
    }
  }

  /**
   * Call on mousemove to track hover. Only notifies when the hovered pin changes.
   */
  handleHover(
    cx: number,
    cy: number,
    pins: Color[],
    canvasRect: CanvasRect,
    imgW: number,
    imgH: number,
  ): void {
    const pinId = findPinAt(cx, cy, pins, canvasRect, imgW, imgH);
    if (pinId === this.lastHoveredId) return;
    this.lastHoveredId = pinId;
    this.onHoverCallback?.(pinId);
  }

  /** Returns the currently hovered pin id, or null. */
  getHoveredId(): string | null { return this.lastHoveredId; }
}
