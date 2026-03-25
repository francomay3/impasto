# EPIC-12: PixiJS for the Viewport Canvas

## Summary
Replace the DOM+CSS canvas approach with a PixiJS `Application`. The canvas image becomes a `Sprite`, pins become `Container`s, and pan/zoom becomes a GPU matrix multiply. Implement incrementally behind a `VITE_USE_PIXI` feature flag.

**Scope:** High-effort, long-term architectural change.

---

## Tickets

- [ ] **TICKET-12-A:** Install PixiJS and confirm build succeeds

  Install `pixi.js` and verify the existing build pipeline is unaffected.

  **AC:**
  - `grep '"pixi.js"' package.json` returns a result.
  - `npm run build` exits with code 0.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-12-B:** Create `PixiViewport` component behind `VITE_USE_PIXI` feature flag

  Create `src/components/PixiViewport.tsx`. Read `import.meta.env.VITE_USE_PIXI`. If truthy, render the Pixi `Application`; otherwise fall back to the existing `CanvasViewport`.

  **AC:**
  - File exists at `src/components/PixiViewport.tsx`.
  - `grep -n "VITE_USE_PIXI" src/components/PixiViewport.tsx` returns a result.
  - `VITE_USE_PIXI=true npm run build` exits with code 0.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-12-C:** Render the canvas image as a PixiJS `Sprite`

  Load the image as a PixiJS `Texture` from the existing image source in context and render it as a `Sprite`.

  **AC:**
  - `grep -n "Sprite\|Texture" src/components/PixiViewport.tsx` returns results.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-12-D:** Implement pan/zoom via PixiJS container transform

  Wire mouse/wheel events to manipulate the Pixi root `Container`'s `x`, `y`, and `scale` properties.

  **AC:**
  - `grep -n "container\.x\|container\.scale\|container\.y" src/components/PixiViewport.tsx` returns results.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-12-E:** Write unit test asserting `PixiViewport` renders the fallback when flag is unset

  Render `PixiViewport` without setting `VITE_USE_PIXI`. Assert the existing `CanvasViewport` is rendered instead of the Pixi canvas.

  **AC:**
  - Test file exists at `src/components/__tests__/PixiViewport.featureFlag.test.tsx`.
  - Test asserts the Pixi `Application` is NOT initialized when the flag is absent.
  - `npx vitest run src/components/__tests__/PixiViewport.featureFlag.test` exits with code 0.

- [ ] **TICKET-12-F:** Migrate sample pins to PixiJS `Graphics` + `Text`

  Replace absolute-positioned pin divs with Pixi `Container`s containing `Graphics` circles and `Text` labels. Keep label collision resolution.

  **AC:**
  - `grep -n "Graphics\|Text" src/components/PixiViewport.tsx` returns results for pin rendering.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-12-G:** Migrate sampler overlay to PixiJS `Graphics`

  Replace the HTML canvas sampler circle with a Pixi `Graphics` object updated in the ticker loop.

  **AC:**
  - `grep -n "ticker\|Graphics" src/components/PixiViewport.tsx` returns results for the sampler.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-12-H:** Remove feature flag and delete old `CanvasViewport` once Pixi is stable

  After all above tickets pass, remove `VITE_USE_PIXI`, make Pixi the default, and delete `CanvasViewport.tsx`.

  **AC:**
  - `grep -rn "VITE_USE_PIXI\|CanvasViewport" src/` returns no results.
  - `npm run build` exits with code 0.
  - `npx tsc --noEmit` exits with code 0.
