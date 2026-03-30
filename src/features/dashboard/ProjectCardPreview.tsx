import { useEffect, useRef, useState } from 'react';
import type { ProjectState } from '../../types';

function normalizeHex(hex: string): string {
  const h = hex.replace('#', '');
  return '#' + (h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0').slice(0, 6));
}

function isUsable(hex: string) {
  const v = parseInt(hex.replace('#', ''), 16);
  const r = ((v >> 16) & 0xff) / 255;
  const g = ((v >> 8) & 0xff) / 255;
  const b = (v & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  return l >= 0.1 && l <= 0.85 && s >= 0.15;
}

function PaletteThumbnail({ palette }: { palette: ProjectState['palette'] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#1a1b1e';
    ctx.fillRect(0, 0, W, H);

    const usable = palette.filter(c => isUsable(c.hex));
    const colors = usable.length > 0 ? usable : palette.length > 0 ? palette : [{ hex: '#444' }];
    const shuffled = [...colors].sort(() => Math.random() - 0.5);

    shuffled.forEach(({ hex }) => {
      const normalized = normalizeHex(hex);
      const blobs = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < blobs; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const r = 30 + Math.random() * 80;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, normalized + '99');
        g.addColorStop(1, normalized + '00');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [palette]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{ width: '100%', height: '100%', filter: 'blur(10px) saturate(1.5)', transform: 'scale(1.15)' }}
    />
  );
}

export function ProjectCardPreview({ project }: { project: ProjectState }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <PaletteThumbnail palette={project.palette} />}
      {project.imageStorageUrl && (
        <img
          src={project.imageStorageUrl}
          alt={project.name}
          onLoad={() => setLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: loaded ? 'block' : 'none' }}
        />
      )}
    </>
  );
}
