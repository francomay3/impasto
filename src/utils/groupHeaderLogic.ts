export function areAllPinsHidden(sampleColorIds: string[], hiddenPinIds: Set<string>): boolean {
  return sampleColorIds.length > 0 && sampleColorIds.every((id) => hiddenPinIds.has(id));
}
