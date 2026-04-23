/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import pkg from './package.json' with { type: 'json' };

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
  plugins: [
    react(),
    // Run `bun run analyze` to generate dist/bundle-analysis.html
    process.env.ANALYZE === 'true' &&
      visualizer({ open: true, filename: 'dist/bundle-analysis.html', gzipSize: true, brotliSize: true }),
  ],
  resolve: {
    alias: {
      ...pakoAlias,
      '@impasto/engine': path.resolve('./src/REFACTOR/ImpastoEngine'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
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
        'src/features/canvas/engine/overlayProps.types.ts',
        'src/utils/canvasUtils.ts',
        // REFACTOR engine — public barrel + type-only API / DTO shapes (executable code is covered elsewhere)
        'src/REFACTOR/ImpastoEngine/index.ts',
        'src/REFACTOR/ImpastoEngine/core/ImpastoEngineApi.ts',
        'src/REFACTOR/ImpastoEngine/core/impastoDocumentSnapshot.ts',
        'src/REFACTOR/ImpastoEngine/pipeline/filterChainWorkerProtocol.ts',
        'src/REFACTOR/ImpastoEngine/pipeline/indexedPassWorkerProtocol.ts',
        'src/REFACTOR/ImpastoEngine/pipeline/indexedPassTypes.ts',
        'src/REFACTOR/ImpastoEngine/pipeline/pipelineIndexConfig.ts',
        'src/REFACTOR/persistence/IStorageAdapter.ts',
        'src/REFACTOR/persistence/impastoProjectDto.ts',
        'src/REFACTOR/ImpastoEngine/tools/toolConfigParams.ts',
        // REFACTOR engine — canvas / DOM wiring (parity with `src/features/canvas/*` exclusions above)
        'src/REFACTOR/ImpastoEngine/colorPins/viewports/ViewportColorPins.ts',
        'src/REFACTOR/ImpastoEngine/viewports/canvas/host/forwardWheelToViewportCanvas.ts',
        'src/REFACTOR/ImpastoEngine/viewports/canvas/host/viewportCanvasGestures.ts',
        'src/REFACTOR/ImpastoEngine/viewports/canvas/host/viewportCanvasPointerBridge.ts',
        'src/REFACTOR/ImpastoEngine/viewports/canvas/render/viewportCanvasRenderer.ts',
        'src/REFACTOR/ImpastoEngine/viewports/canvas/render/viewportCanvasResizer.ts',
        'src/REFACTOR/ImpastoEngine/viewports/canvas/chrome/sampleColorReticle.ts',
        'src/REFACTOR/ImpastoEngine/viewports/canvas/surfaces/**',
        // Headless viewport model + thin canvas façade (DOM / integration; covered indirectly in app)
        'src/REFACTOR/ImpastoEngine/viewport/Viewport.ts',
        'src/REFACTOR/ImpastoEngine/viewport/models.ts',
        // Dev-only and toolbar UI (not unit-tested in isolation; exercised in browser)
        'src/features/dev/**',
        'src/features/canvas/ContextualToolbar/**',
        // React context wiring — branch-heavy provider toggles; covered in integration
        'src/features/filters/FilterContext.tsx',
        'src/features/palette/PaletteContext.tsx',
        // Persistence — network / blob I/O
        'src/REFACTOR/persistence/loadRawImageFromUrl.ts',
        'src/REFACTOR/persistence/rawImageToPngBlob.ts',
        // Firebase adapters — branch-heavy error paths; integration-tested outside unit coverage
        'src/REFACTOR/persistence/FirestoreStorageAdapter.ts',
        'src/REFACTOR/persistence/firestoreImpastoProjectDoc.ts',
        // Misc infrastructure
        'src/utils/dndSensor.ts',
        'src/lib/queryKeys.ts',
        'src/tools.ts',
        // New engine (src/engine/) — mirrors REFACTOR exclusions for the same categories
        // Public barrel + type-only API / DTO shapes
        'src/engine/index.ts',
        'src/engine/core/ImpastoEngineApi.ts',
        'src/engine/core/impastoDocumentSnapshot.ts',
        'src/engine/core/engineConstants.ts',
        'src/engine/core/impastoEngineBootTypes.ts',
        'src/engine/colorPins/colorPinTypes.ts',
        'src/engine/colorPins/colorPinPlacementApiHost.ts',
        'src/engine/pipeline/pipelineIndexConfig.ts',
        'src/engine/pipeline/filterChainWorkerProtocol.ts',
        'src/engine/pipeline/indexedPassWorkerProtocol.ts',
        'src/engine/pipeline/indexedPassTypes.ts',
        'src/engine/tools/toolConfigParams.ts',
        // Canvas / DOM wiring
        'src/engine/colorPins/colorPinOverlayImageDragSession.ts',
        'src/engine/colorPins/viewports/**',
        'src/engine/viewports/canvas/host/forwardWheelToViewportCanvas.ts',
        'src/engine/viewports/canvas/host/viewportCanvasGestures.ts',
        'src/engine/viewports/canvas/host/viewportCanvasMarqueePointerSession.ts',
        'src/engine/viewports/canvas/host/viewportCanvasPanWheelPointer.ts',
        'src/engine/viewports/canvas/host/viewportCanvasPointerBridge.ts',
        'src/engine/viewports/canvas/host/viewportCanvasPointerReticleChrome.ts',
        'src/engine/viewports/canvas/render/viewportCanvasRenderer.ts',
        'src/engine/viewports/canvas/render/viewportCanvasResizer.ts',
        'src/engine/viewports/canvas/surfaces/**',
        // React context wiring
        'src/engine/core/ImpastoEngineContext.tsx',
        // Zustand stores
        'src/engine/colorPins/colorPinHighlightStore.ts',
        // Storage — type/interface-only and network/Firebase I/O
        'src/storage/IStorageAdapter.ts',
        'src/storage/IProjectMetadataAdapter.ts',
        'src/storage/projectMetadata.ts',
        'src/storage/impastoProjectDto.ts',
        'src/storage/loadRawImageFromUrl.ts',
        'src/storage/rawImageToWebpBlob.ts',
        'src/storage/firestoreImpastoProjectDoc.ts',
        'src/storage/FirestoreStorageAdapter.ts',
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
