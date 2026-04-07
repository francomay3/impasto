import { useEffect, useState } from 'react';
import { getProjectImageUrl } from '../services/ImageStorageService';

export function useProjectImageUrl(pathOrUrl: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!pathOrUrl) return;
    getProjectImageUrl(pathOrUrl).then(setUrl).catch(() => setUrl(null));
  }, [pathOrUrl]);
  return url;
}
