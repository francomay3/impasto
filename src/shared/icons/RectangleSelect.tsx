interface Props { size?: number }

export function RectangleSelect({ size = 16 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={3} width={18} height={18} rx={1} strokeDasharray="4 3" />
    </svg>
  );
}
