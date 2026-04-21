/**
 * Mantine Menu / Popover close-on-outside-click listens on `mousedown` by default.
 * Viewport canvases call `preventDefault()` on `pointerdown` for tools like sample-color; that suppresses
 * compatibility mouse events, so `mousedown` never reaches `document` and menus stay open. Including
 * `pointerdown` restores dismiss behaviour when interacting with the canvas.
 */
export const MANTINE_MENU_CLICK_OUTSIDE_EVENTS: string[] = ['mousedown', 'touchstart', 'pointerdown', 'keydown'];
