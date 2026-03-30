import { useRef } from 'react';
import { Box, Text, Stack, Button } from '@mantine/core';
import { Upload } from 'lucide-react';

interface Props {
  onFileSelected: (file: File) => void;
  style?: React.CSSProperties;
}

export function ImageUploader({ onFileSelected, style }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <Box
      data-testid="image-uploader"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        border: '2px dashed var(--mantine-color-dark-3)',
        borderRadius: 8,
        padding: 48,
        textAlign: 'center',
        cursor: 'pointer',
        background: 'var(--mantine-color-dark-7)',
        ...style,
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <Stack align="center" gap="xs">
        <Upload size={40} color="var(--mantine-color-dark-1)" />
        <Text size="lg" c="dimmed">Drop an image here or click to upload</Text>
        <Button variant="light" size="sm" color="tertiary">Choose File</Button>
      </Stack>
    </Box>
  );
}
