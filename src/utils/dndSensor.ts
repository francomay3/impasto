import { PointerSensor } from '@dnd-kit/core';
import type { PointerActivationConstraint } from '@dnd-kit/core';

const INTERACTIVE_TAGS = new Set(['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A']);

function isInteractiveElement(element: HTMLElement | null): boolean {
  let node = element;
  while (node) {
    if (INTERACTIVE_TAGS.has(node.tagName)) return true;
    node = node.parentElement;
  }
  return false;
}

export class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: (
        { nativeEvent }: React.PointerEvent,
        { onActivation }: { activationConstraint: PointerActivationConstraint; onActivation?: (event: PointerEvent) => void },
      ) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0 || isInteractiveElement(nativeEvent.target as HTMLElement)) {
          return false;
        }
        onActivation?.({ event: nativeEvent } as Parameters<NonNullable<typeof onActivation>>[0]);
        return true;
      },
    },
  ];
}
