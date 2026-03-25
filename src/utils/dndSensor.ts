import { MouseSensor } from '@dnd-kit/core';

const INTERACTIVE_TAGS = new Set(['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A']);

function isInteractiveElement(element: HTMLElement | null): boolean {
  let node = element;
  while (node) {
    if (INTERACTIVE_TAGS.has(node.tagName)) return true;
    node = node.parentElement;
  }
  return false;
}

export class SmartMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: ({ nativeEvent }: React.MouseEvent) => {
        if (nativeEvent.button !== 0 || isInteractiveElement(nativeEvent.target as HTMLElement)) {
          return false;
        }
        return true;
      },
    },
  ];
}
