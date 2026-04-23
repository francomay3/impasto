# Impasto

A web app for artists to pull color palettes from reference images and get mixing recipes you can use at the easel.

Upload a photo, place sample pins, and the mixer suggests which pigments to combine and in what proportions so each swatch is as close as possible in perceptual color space.

---

## What it does

**Sampling** — Load a reference (common raster formats; HEIC is supported via conversion). Pick colors with the eyedropper or use k-means to suggest a set of swatches. Pins are tied to image coordinates; you can move or organize them in groups.

**Paint mixing** — A dedicated mixer (`ColorMixer` and related optimizers) searches single-pigment and multi-pigment combinations from a **library of 16 named pigments** (Titanium White, Cadmium Red, Ultramarine Blue, etc.), constrained by your enabled palette and mix settings, and returns percentage-style recipes with a delta-E readout.

**Image pipeline** — Non-destructive filters (levels, contrast, color balance, blur, etc.) run in workers where appropriate; hot paths use **Rust compiled to WebAssembly** (`img_ops` for filter math, `img_index` for indexed / quantization-style steps). Prebuilt WASM is committed under `src/wasm/`; you only need a Rust toolchain to rebuild.

**Cloud projects** — Firebase (Auth, Firestore, Cloud Storage) stores project documents and the source image. Use `.env` with your own Firebase project for local dev.

**Export** — Build a **PDF** of the palette (swatches, structure, and recipe text) for studio reference.

---

## Tech stack

| Area          | Choice                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| UI            | React 19, TypeScript (strict), [Mantine](https://mantine.dev/) 8                                                     |
| App shell     | [Vite](https://vite.dev/) 8, [React Router](https://reactrouter.com/) 7                                              |
| Client data   | [Zustand](https://github.com/pmndrs/zustand) 5, [TanStack Query](https://tanstack.com/query) 5                       |
| Interactions  | [`@dnd-kit`](https://dndkit.com/) (sortable UI), [`@use-gesture/react`](https://use-gesture.netlify.app/) (viewport) |
| Color & math  | [chroma.js](https://gka.github.io/chroma.js/), [ml-kmeans](https://github.com/mljs/kmeans)                           |
| Backend       | [Firebase](https://firebase.google.com/) JS SDK 12+                                                                  |
| PDF           | [`@react-pdf/renderer`](https://react-pdf.org/)                                                                      |
| Unit tests    | [Vitest](https://vitest.dev/) 4 (V8 coverage)                                                                        |
| Run / scripts | [Bun](https://bun.sh/) — `bun.lock` in repo, scripts assume Bun                                                      |

`@playwright/test` is listed in dev dependencies but there is no Playwright project or `package.json` scripts for E2E yet; day-to-day quality is **unit tests + `project-check`**.

---

## Repository layout (high level)

There is a deliberate split: **testable engine and services** in plain TypeScript modules, and **UI** in React. See `CLAUDE.md` for project conventions (e.g. avoid business logic in components when it can live in `*.ts`).

```
src/
├── engine/            # ImpastoEngine — document, viewport hub, color pins, pipeline, history
├── features/          # Screens and UI (canvas, editor, dashboard, auth, projectv2, …)
├── storage/           # DTOs, Firestore/Storage adapters, load/save glue
├── services/          # ColorMixer, PDF export, Firebase helpers, …
├── workers/           # Web Workers (filters, palette mix bridge, …)
├── wasm/              # Checked-in wasm-pack output (img_ops, img_index)
├── utils/             # Pure helpers (image, math, k-means bridge, …)
└── types/             # Shared types
```

**Canvas and tools** — The interactive canvas is driven by a `CanvasEngine` class under `src/features/canvas/engine/` (viewport, pan/zoom, tool controllers, `ToolStateManager`, and filter pipeline hooks). A separate **`ImpastoEngine`** in `src/engine/` is the long-lived app core for palette resolution, pin state, and persistence wiring. When reading code, follow imports: UI subscribes to engine APIs; heavy logic stays out of render paths where possible.

**ColorMixer** — Tries 1–4 pigment mixes from the enabled subset; uses CIEDE2000 and project-level `minPaintPercent` / `deltaThreshold` (see `src/services/ColorMixer.ts` and the optimizer under `src/services/`).

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) (used for install and scripts; Node is not required for the documented workflow)
- A Firebase project with **Authentication**, **Cloud Firestore**, and **Cloud Storage** enabled (for full cloud features)

### Setup

```bash
bun install
cp .env.example .env
# Set VITE_FIREBASE_* in .env to your Firebase web app config
bun run dev
```

### WASM (optional)

Prebuilt artifacts live in `src/wasm/`. Rebuild with Rust and `wasm-pack` using the `package.json` script:

```bash
bun run build:wasm
```

This runs `cargo build --workspace --target wasm32-unknown-unknown` (so every workspace member, including the shared `img_blur` library) and then `wasm-pack` for the two **cdylib** crates that generate JS glue into `src/wasm/img_ops` and `src/wasm/img_index`. `img_blur` is not a separate web bundle; it is linked into those crates. To rebuild a single cdylib, use `bun run build:wasm:img_ops` or `bun run build:wasm:img_index`.

---

## Scripts

| Command                             | Purpose                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `bun run dev`                       | Dev server (Vite HMR)                                                                                    |
| `bun run build`                     | `tsc -b` then production Vite build                                                                      |
| `bun run preview`                   | Serve the production build locally                                                                       |
| `bun run analyze`                   | Production build with bundle analysis (`dist/bundle-analysis.html`)                                      |
| `bun run test`                      | Unit tests (Vitest)                                                                                      |
| `bun run tsc` / `bun run typecheck` | Typecheck only (`tsc -b --noEmit`)                                                                       |
| `bun run lint`                      | ESLint                                                                                                   |
| `bun run knip`                      | Unused exports / config drift                                                                            |
| `bun run file-length-limit`         | Enforces a line budget on `src` (see script)                                                             |
| `bun run project-check`             | **Full gate:** TypeScript, ESLint, Knip, file length, Vitest with coverage, and `cargo test --workspace` |
| `bun run loc`                       | Line counts (`cloc`, config in `cloc.conf`)                                                              |

> Prefer `bun run project-check` before large merges. A bare `tsc` from the repo root may not run the same project references as `bun run tsc` depending on your shell; use the script.

---

## Development notes

- **Mantine first** for layout and form controls; avoid one-off CSS unless it pays for itself.
- **Keep files small** — `file-length-limit` enforces a 200 _effective_ line cap on production sources (comments/blank lines discounted); split rather than grow God files.
- **Rust tests** — The workspace is part of `project-check`; if you change `crates/`, run `cargo test` (or lean on `project-check`).

For contributor-facing rules in more detail, see `CLAUDE.md`.
