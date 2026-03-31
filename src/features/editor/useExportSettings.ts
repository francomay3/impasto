import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../auth/authStore';
import { loadExportSettings } from '../../services/FirestoreService';
import { queryKeys } from '../../lib/queryKeys';
import { PIGMENTS, DEFAULT_MIN_PAINT_PERCENT, DEFAULT_DELTA_THRESHOLD } from '../../services/ColorMixer';
import type { Pigment } from '../../types';

const ALL_PIGMENT_NAMES = PIGMENTS.map((p) => p.name);

export function useExportSettings(): {
  pigments: Pigment[];
  minPaintPercent: number;
  delta: number;
} {
  const user = useAuthStore((s) => s.user);

  const { data: savedSettings } = useQuery({
    queryKey: queryKeys.exportSettings(user?.uid ?? ''),
    queryFn: () => loadExportSettings(user!.uid),
    enabled: !!user,
    staleTime: Infinity,
  });

  const minPaintPercent = savedSettings?.minPaintPercent ?? DEFAULT_MIN_PAINT_PERCENT;
  const delta = savedSettings?.delta ?? DEFAULT_DELTA_THRESHOLD;
  const selectedNames = savedSettings?.selectedPigmentNames ?? ALL_PIGMENT_NAMES;
  const pigments = PIGMENTS.filter((p) => selectedNames.includes(p.name));

  return { pigments, minPaintPercent, delta };
}
