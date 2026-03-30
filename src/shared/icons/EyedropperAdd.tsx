import { Pipette, Plus } from 'lucide-react';

interface Props {
  size?: number;
}

export function EyedropperAdd({ size = 16 }: Props) {
  const badgeSize = Math.round(size * 0.55);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      <Pipette size={size} />
      <Plus
        size={badgeSize}
        strokeWidth={3.5}
        style={{ position: 'absolute', bottom: -2, right: -3 }}
      />
    </span>
  );
}
