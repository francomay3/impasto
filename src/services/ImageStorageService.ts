import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 0.85;

function imageRef(userId: string, projectId: string) {
  return ref(storage, `users/${userId}/projects/${projectId}/image`);
}

function compressToWebP(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/webp',
        WEBP_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

export async function uploadProjectImage(
  userId: string,
  projectId: string,
  file: File | Blob
): Promise<string> {
  const compressed = await compressToWebP(file);
  const r = imageRef(userId, projectId);
  await uploadBytes(r, compressed, { contentType: 'image/webp' });
  return `users/${userId}/projects/${projectId}/image`;
}

/** Resolve a storage path (or legacy full URL) to a fresh download URL. */
export async function getProjectImageUrl(pathOrUrl: string): Promise<string> {
  if (pathOrUrl.startsWith('https://')) return pathOrUrl;
  return getDownloadURL(ref(storage, pathOrUrl));
}
