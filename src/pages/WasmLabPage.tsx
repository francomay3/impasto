import { useState } from 'react';
import { Center, Stack, Title, FileInput, Divider } from '@mantine/core';
import type { RawImage } from '../types';
import { createRawImage } from '../types';
import { PipelineSection } from '../components/WasmLab/PipelineSection';
import { IndexSection } from '../components/WasmLab/IndexSection';

const MAX_PIXELS = (1920 * 1080) * 0.9;

function fileToRawImage(file: File): Promise<RawImage> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, Math.sqrt(MAX_PIXELS / (img.width * img.height)));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const { data, width, height } = canvas.getContext('2d')!.getImageData(0, 0, w, h);
      resolve(createRawImage(data, width, height));
    };
    img.src = url;
  });
}

export function WasmLabPage() {
  const [sourceImage, setSourceImage] = useState<RawImage | null>(null);

  function handleFile(file: File | null) {
    if (file) fileToRawImage(file).then(setSourceImage);
  }

  return (
    <Center>
      <Stack w={800} p="xl" gap="xl">
        <Title order={1}>Wasm Lab</Title>
        <FileInput label="Source image" accept="image/*" onChange={handleFile} />
        <PipelineSection sourceImage={sourceImage} />
        <Divider size="sm" />
        <IndexSection sourceImage={sourceImage} />
      </Stack>
    </Center>
  );
}
