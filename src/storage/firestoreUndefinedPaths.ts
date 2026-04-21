/**
 * Walks a JSON-serializable object tree and collects dot/bracket paths where a value is `undefined`.
 * Firestore rejects `undefined` anywhere in `setDoc` payloads; {@link FirestoreStorageAdapter} logs these paths
 * before write so persistence bugs surface in the console instead of as silent SDK failures.
 */
export function pathsToUndefinedValues(root: unknown, prefix = ''): string[] {
  if (root === undefined) {
    return prefix ? [prefix] : ['<root>'];
  }
  if (root === null || typeof root !== 'object') {
    return [];
  }
  if (Array.isArray(root)) {
    const out: string[] = [];
    root.forEach((v, i) => {
      out.push(...pathsToUndefinedValues(v, `${prefix}[${i}]`));
    });
    return out;
  }
  const out: string[] = [];
  for (const [k, v] of Object.entries(root as Record<string, unknown>)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v === undefined) {
      out.push(p);
    } else {
      out.push(...pathsToUndefinedValues(v, p));
    }
  }
  return out;
}
