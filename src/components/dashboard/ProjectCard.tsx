import { Card, Text, ActionIcon, Group, Stack, Menu } from '@mantine/core';
import { MoreHorizontal, FolderOpen, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectState } from '../../types';

interface Props {
  project: ProjectState;
  onDelete: (id: string) => void;
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
      const blobs = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < blobs; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const r = 30 + Math.random() * 80;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, hex + '99');
        g.addColorStop(1, hex + '00');
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

function ProjectCardPreview({ project }: { project: ProjectState }) {
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

export function ProjectCard({ project, onDelete }: Props) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const date = new Date(project.updatedAt).toLocaleDateString();
  const open = () => navigate(`/project/${project.id}`);

  return (
    <Card
      radius="md"
      padding="sm"
      style={{
        background: 'var(--mantine-color-dark-7)',
        border: `1px solid ${hovered ? 'var(--mantine-color-primary-6)' : 'var(--mantine-color-dark-5)'}`,
        cursor: 'pointer',
        transition: 'border-color 150ms ease',
      }}
      onClick={open}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card.Section style={{ height: 200, display: 'flex', overflow: 'hidden' }}>
        <ProjectCardPreview project={project} />
      </Card.Section>

      {project.palette.length > 0 && (
        <Card.Section style={{ display: 'flex', height: 8 }}>
          {project.palette.map(c => (
            <div key={c.id} style={{ flex: 1, background: c.hex }} />
          ))}
        </Card.Section>
      )}

      <Group justify="space-between" mt="xs" wrap="nowrap">
        <Stack gap={0} style={{ minWidth: 0 }}>
          <Text size="sm" fw={500} c="white" lineClamp={1}>{project.name}</Text>
          <Text size="xs" c="dimmed">{date}</Text>
        </Stack>

        <Menu withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" onClick={e => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<FolderOpen size={14} />} onClick={e => { e.stopPropagation(); open(); }}>
              Open
            </Menu.Item>
            <Menu.Item
              leftSection={<Trash2 size={14} />}
              color="red"
              onClick={e => { e.stopPropagation(); onDelete(project.id); }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}
