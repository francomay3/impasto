import { useEffect, useRef, useState } from 'react';
import type { ProjectState } from '../../types';
import { useProjectImageUrl } from '../../hooks/useProjectImageUrl';
import { drawPaletteThumbnail } from '../../utils/canvasUtils';

function PaletteThumbnail({ thumbnailColors }: { thumbnailColors: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPaletteThumbnail(ctx, canvas.width, canvas.height, thumbnailColors);
  }, [thumbnailColors]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{
        width: '100%',
        height: '100%',
        filter: 'blur(10px) saturate(1.5)',
        transform: 'scale(1.15)',
      }}
    />
  );
}

export function ProjectCardPreview({ project }: { project: ProjectState }) {
  const [loaded, setLoaded] = useState(false);
  const imageUrl = useProjectImageUrl(project.imageStorageUrl);

  return (
    <>
      {!loaded && <PaletteThumbnail thumbnailColors={project.thumbnailColors ?? []} />}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={project.name}
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: loaded ? 'block' : 'none',
          }}
        />
      )}
    </>
  );
}
