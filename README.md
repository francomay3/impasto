# Impasto

A web-based tool for artists to extract color palettes from reference images and generate paint mixing recipes for real-world use.

Upload a reference photo, sample colors from it, and get precise acrylic/oil paint recipes that tell you which pigments to mix and in what ratios to match each extracted color.

---

## What it does

**Color extraction** — Import any image and interactively sample colors from it using an eyedropper tool or automated k-means quantization. Sampled colors appear as draggable pins on the canvas that you can reposition at any time.

**Paint mixing recipes** — For each extracted color, a mixing engine computes the optimal combination of up to four pigments from a library of 16 standard artist pigments (Titanium White, Cadmium Yellow, Ultramarine Blue, etc.) using CIEDE2000 color distance to minimize perceptual error. Results are shown as percentage ratios.

**Non-destructive filter pipeline** — Apply brightness/contrast, hue/saturation, levels, and blur adjustments to the source image before sampling. Filters run in a Web Worker via Rust/WASM for performance.

**Palette management** — Organize colors into named groups, reorder them via drag-and-drop, hide/show pins on the canvas, and annotate groups.

**PDF export** — Export the full palette as a PDF with color swatches, group structure, and mixing recipes.

**Cloud sync** — Projects are persisted to Firebase (Firestore + Cloud Storage) and accessible across devices.

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| Routing | React Router 7 |
| Components | Mantine 8 |
| State management | Zustand 5 (editor state) + React Query 5 (server state) |
| Tool interactions | XState 5 (state machine) |
| Drag-and-drop | dnd-kit |
| Color math | Chroma.js |
| Performance-critical paths | Rust compiled to WASM via wasm-pack |
| Backend | Firebase (Auth, Firestore, Cloud Storage) |
| PDF generation | React PDF Renderer |
| Unit tests | Vitest |
| E2E tests | Playwright |

---

## Architecture

The codebase follows a strict rule: **no business logic in React components or hooks**. All color math, viewport transforms, tool state machines, and filter algorithms live in plain `.ts` files that can be unit tested without React.

```
src/
├── features/
│   ├── canvas/
│   │   └── engine/        ← CanvasEngine: viewport, pan/zoom, tool state (plain TS class)
│   ├── editor/            ← Main editor layout and context wiring
│   ├── palette/           ← Palette sidebar, color pins, groups
│   ├── filters/           ← Filter panel and filter pipeline
│   ├── auth/              ← Authentication UI
│   └── dashboard/         ← Project listing
├── services/
│   ├── ColorMixer.ts      ← Paint mixing recipe engine
│   ├── FirestoreService.ts
│   └── PalettePdf.tsx
├── utils/
│   ├── imageProcessing.ts ← Filter application algorithms
│   ├── pixelMath.ts       ← Pure pixel-level math (testable)
│   └── kMeansWrapper.ts   ← K-means quantization
├── workers/               ← Web Workers for off-thread image processing
├── wasm/                  ← Compiled WASM modules (img_ops, img_index, img_blur)
└── types/index.ts         ← Shared types
```

### Key components

**CanvasEngine** (`src/features/canvas/engine/CanvasEngine.ts`) — A plain TypeScript class that owns all canvas interaction state: viewport transforms, pan/zoom, tool mode, drag state, and pin hit testing. It uses an XState machine internally for tool transitions and publishes state changes via a subscribe pattern. React components read from it but never own its logic.

**ColorMixer** (`src/services/ColorMixer.ts`) — Tries single-pigment, then 2-, 3-, and 4-pigment combinations against a pre-defined palette of 16 pigments. Scores each candidate using CIEDE2000 delta-E and returns the closest match as a recipe with percentage ratios.

**Image pipeline** — Filters are applied in a Web Worker. Pixel-level operations (brightness, contrast, levels, hue rotation) run in TypeScript via `pixelMath.ts`. The k-means quantization step runs in WASM (`img_index` crate) for performance.

**Viewport performance** — Pan/zoom transforms bypass React's render cycle during drag. The canvas element's transform is applied imperatively via a `subscribeToTransform` callback, preventing frame drops at high drag velocity.

### State

Five Zustand stores manage local UI state (selected color IDs, active tool, hidden pins, etc.). Server state (palette, filters, project metadata) is managed separately and persisted to Firestore on every change, debounced. Hex color values are never persisted — they are always derived at runtime from sampled RGB data.

---

## Getting started

### Prerequisites

- Node.js 20+
- A Firebase project with Auth, Firestore, and Cloud Storage enabled

### Setup

```bash
npm install
cp .env.example .env
# Fill in your Firebase credentials in .env
npm run dev
```

### WASM modules

Pre-compiled WASM modules are checked in under `src/wasm/`. To rebuild them from source (requires Rust + wasm-pack):

```bash
npm run build:wasm
```

---

## Scripts

```bash
npm run dev              # Start dev server with HMR
npm run build            # Production build
npm run typecheck        # TypeScript + ESLint + knip + file length checks
npm run lint             # ESLint only
npm run knip             # Detect unused exports and dead code
npm run test:unit        # Unit tests (Vitest)
npm run test             # E2E tests (Playwright, headless)
npm run test:headed      # E2E tests with browser visible
npm run test:report      # Open HTML test report
```

> Use `npm run typecheck` (not bare `tsc`) — the project uses a split tsconfig setup where bare `tsc --noEmit` is a silent no-op.

---

## Development guidelines

- **No logic in components** — if it can be a `.ts` file, it must be a `.ts` file.
- **Test pure logic** — every function in `utils/` and `services/` should have unit test coverage.
- **Files stay under 160 lines** — if a file is growing past that, split it.
- **Mantine first** — use Mantine components before reaching for raw HTML elements.
- See `CLAUDE.md` for the full rule set.
