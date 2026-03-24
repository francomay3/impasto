import { useRef } from 'react';
import { Box, Text, Stack, Button, useMantineTheme } from '@mantine/core';
import { Upload } from 'lucide-react';

interface Props {
  onImageLoad: (dataUrl: string) => void;
}

export function ImageUploader({ onImageLoad }: Props) {
  const theme = useMantineTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onImageLoad(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <Box
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        border: '2px dashed var(--mantine-color-dark-3)',
        borderRadius: 8,
        padding: 48,
        textAlign: 'center',
        cursor: 'pointer',
        background: 'var(--mantine-color-dark-7)',
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Stack align="center" gap="xs">
        <Upload size={40} color="var(--mantine-color-dark-1)" />
        <Text size="lg" c="dimmed">Drop an image here or click to upload</Text>
        <Button variant="light" size="sm" color={theme.other.tertiaryColor as string}>Choose File</Button>
      </Stack>
    </Box>
  );
}
