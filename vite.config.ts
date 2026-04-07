/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// pako is not a top-level dep — it lives inside browserify-zlib (a @react-pdf/pdfkit dep).
// Rolldown can't resolve the deep pako/* imports, so we alias them explicitly.
const pakoBase = path.resolve('./node_modules/browserify-zlib/node_modules/pako');
const pakoAlias = ['zstream', 'deflate', 'inflate', 'constants'].reduce<Record<string, string>>(
  (acc, name) => {
    acc[`pako/lib/zlib/${name}.js`] = `${pakoBase}/lib/zlib/${name}.js`;
    return acc;
  },
  {}
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: pakoAlias },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/firebase.ts',
        'src/routes/AppRouter.tsx',
        'src/workers/**',
        'src/wasm/**',
        // React hooks — wiring only, no testable pure logic
        'src/**/use*.ts',
        // Firebase / remote services — require network infrastructure
        'src/services/FirestoreService.ts',
        'src/services/ImageStorageService.ts',
        'src/services/PdfExport.ts',
        'src/services/PalettePdfStyles.ts',
        'src/services/userService.ts',
        'src/features/admin/adminService.ts',
        // Zustand stores
        'src/features/auth/authStore.ts',
        'src/features/editor/editorStore.ts',
        'src/shared/contextMenuStore.ts',
        'src/features/palette/selectionPopoverStore.ts',
        // Canvas / browser API dependents
        'src/features/canvas/canvasMeasure.ts',
        'src/features/canvas/engine/overlayProps.ts',
        'src/features/canvas/engine/overlayProps.types.ts',
        'src/features/canvas/engine/viewportState.ts',
        'src/utils/canvasUtils.ts',
        // Misc infrastructure
        'src/utils/dndSensor.ts',
        'src/lib/queryKeys.ts',
        'src/tools.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
});
