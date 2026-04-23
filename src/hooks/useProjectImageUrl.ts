import { useEffect, useState } from 'react';
import { getProjectImageUrl } from '../services/ImageStorageService';
import { projectSourceImageWebpStoragePath } from '../storage/firestoreImpastoProjectDoc';

/** Resolves a download URL for the canonical `source.webp` object; null if missing or unauthorized. */
export function useProjectImageUrl(userId: string | undefined, projectId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!userId || !projectId) {
      // Defer so we don’t setState synchronously in the effect body (react compiler / lint).
      const t = requestAnimationFrame(() => setUrl(null));
      return () => cancelAnimationFrame(t);
    }
    const path = projectSourceImageWebpStoragePath(userId, projectId);
    let cancelled = false;
    getProjectImageUrl(path)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, projectId]);
  return url;
}
