import { useState, useCallback } from 'react';

export function useHiddenPins() {
  const [hiddenPinIds, setHiddenPinIds] = useState<Set<string>>(new Set());

  const onTogglePinVisibility = useCallback((id: string) => {
    setHiddenPinIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onSetGroupPinsVisible = useCallback((colorIds: string[], visible: boolean) => {
    setHiddenPinIds((prev) => {
      const next = new Set(prev);
      colorIds.forEach((id) => (visible ? next.delete(id) : next.add(id)));
      return next;
    });
  }, []);

  return { hiddenPinIds, onTogglePinVisibility, onSetGroupPinsVisible };
}
