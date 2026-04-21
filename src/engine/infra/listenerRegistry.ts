/**
 * Small pub/sub helper: O(n) notify, unsubscribe by identity (same listener reference).
 */
export class ListenerRegistry<T extends unknown[]> {
  private readonly listeners: Array<(...args: T) => void> = [];

  add(listener: (...args: T) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const i = this.listeners.indexOf(listener);
      if (i !== -1) {
        this.listeners.splice(i, 1);
      }
    };
  }

  notify(...args: T): void {
    for (const listener of this.listeners) {
      listener(...args);
    }
  }
}
