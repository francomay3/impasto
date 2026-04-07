import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { PIGMENTS, DEFAULT_MIN_PAINT_PERCENT, DEFAULT_DELTA_THRESHOLD } from '../../services/ColorMixer';
import { loadExportSettings, saveExportSettings } from '../../services/FirestoreService';
import { queryKeys } from '../../lib/queryKeys';

const ALL_PIGMENT_NAMES = PIGMENTS.map((p) => p.name);

export function useExportSettingsForm(userId: string | undefined, opened: boolean) {
  const queryClient = useQueryClient();

  const { data: savedSettings, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.exportSettings(userId ?? ''),
    queryFn: () => loadExportSettings(userId!),
    enabled: !!userId && opened,
    staleTime: Infinity,
  });

  const [minPaintPercent, setMinPaintPercent] = useState(DEFAULT_MIN_PAINT_PERCENT);
  const [delta, setDelta] = useState(DEFAULT_DELTA_THRESHOLD);
  const [selectedPigmentNames, setSelectedPigmentNames] = useState<string[]>(ALL_PIGMENT_NAMES);

  const resolved = savedSettings ?? null;
  const effectiveMin = resolved?.minPaintPercent ?? minPaintPercent;
  const effectiveDelta = resolved?.delta ?? delta;
  const effectivePigmentNames = resolved?.selectedPigmentNames ?? selectedPigmentNames;
  const pigments = useMemo(() => new Set(effectivePigmentNames), [effectivePigmentNames]);

  const saveMutation = useMutation({
    mutationFn: (settings: { minPaintPercent: number; delta: number; selectedPigmentNames: string[] }) =>
      saveExportSettings(userId!, settings),
    onSuccess: (_, settings) => {
      queryClient.setQueryData(queryKeys.exportSettings(userId!), settings);
    },
    onError: () => {
      notifications.show({ message: 'Failed to save export settings', color: 'red' });
    },
  });

  const updateCache = (patch: Partial<{ minPaintPercent: number; delta: number; selectedPigmentNames: string[] }>) => {
    if (resolved) queryClient.setQueryData(queryKeys.exportSettings(userId!), { ...resolved, ...patch });
  };

  const handleMinChange = (v: number | string) => {
    const n = Number(v);
    setMinPaintPercent(n || effectiveMin);
    updateCache({ minPaintPercent: n || effectiveMin });
  };

  const handleDeltaChange = (v: number | string) => {
    const n = Number(v);
    setDelta(n || effectiveDelta);
    updateCache({ delta: n || effectiveDelta });
  };

  const handlePigmentToggle = (name: string, checked: boolean) => {
    const next = new Set(pigments);
    if (checked) next.add(name); else next.delete(name);
    const names = [...next];
    setSelectedPigmentNames(names);
    updateCache({ selectedPigmentNames: names });
  };

  return {
    settingsLoading,
    effectiveMin,
    effectiveDelta,
    effectivePigmentNames,
    pigments,
    saveMutation,
    handleMinChange,
    handleDeltaChange,
    handlePigmentToggle,
  };
}
