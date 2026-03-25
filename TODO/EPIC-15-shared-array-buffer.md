# EPIC-15: SharedArrayBuffer for Zero-Copy Worker Communication

## Summary
Currently `ImageData` is copied when posted to workers (33MB for a 4K image per filter update). Use `SharedArrayBuffer` to share the pixel buffer between main thread and worker with no copy. Requires COOP/COEP HTTP headers to be set.

**Depends on:** EPIC-09 (filter worker)

---

## Tickets

- [ ] **TICKET-15-A:** Add COOP/COEP headers to Vite dev server and build config

  Add `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to the Vite dev server `headers` config and to the build output's static header config (e.g. `public/_headers` for Netlify/Vercel, or server middleware).

  **AC:**
  - `grep -n "Cross-Origin-Opener-Policy\|Cross-Origin-Embedder-Policy\|COOP\|COEP" vite.config.ts` returns results.
  - `npx vite build` exits with code 0.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-15-B:** Allocate pixel buffer as `SharedArrayBuffer` on image load

  When an image is loaded, allocate a `SharedArrayBuffer` of `width * height * 4` bytes and copy the initial `ImageData` into it via `Uint8ClampedArray`.

  **AC:**
  - `grep -rn "SharedArrayBuffer" src/` returns at least one result in the image loading path.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-15-C:** Update filter worker to read/write directly from `SharedArrayBuffer`

  Pass the SAB reference to the worker once (on init). For each `applyFilters` message, the worker wraps the SAB in a `Uint8ClampedArray` and processes in place — no `ImageData` copy is sent per message.

  **AC:**
  - `grep -n "SharedArrayBuffer\|Uint8ClampedArray" src/workers/filterPipeline.worker.ts` returns results.
  - No `ArrayBuffer` appears in the `postMessage` transfer list for `applyFilters` messages (verified by the test in TICKET-15-E).
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-15-D:** Add `Atomics`-based write guard to prevent concurrent read/write

  Use an `Int32Array` over a small separate `SharedArrayBuffer` as a lock. The worker sets the lock before writing and clears it when done. The main thread checks the lock before reading.

  **AC:**
  - `grep -rn "Atomics\." src/` returns results in the worker and the main-thread read path.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-15-E:** Write test asserting no `ArrayBuffer` is transferred for `applyFilters` messages

  Spy on `Worker.prototype.postMessage`. After setup, send an `applyFilters` message and assert the transfer list argument is empty (no buffer copy).

  **AC:**
  - Test file exists at `src/workers/__tests__/filterPipeline.sharedBuffer.test.ts`.
  - `postMessage` spy shows an empty transfer array for `applyFilters` calls (after the initial `init`).
  - `npx vitest run src/workers/__tests__/filterPipeline.sharedBuffer.test` exits with code 0.

- [ ] **TICKET-15-F:** Write test asserting the `SharedArrayBuffer` is only allocated once per image load

  Load the same image twice and assert the `SharedArrayBuffer` constructor was called once (not twice), because the second load should reuse or replace the existing buffer rather than accumulating allocations.

  **AC:**
  - Same test file as TICKET-15-E, separate test case.
  - `SharedArrayBuffer` constructor spy call count equals 1 per unique image load.
  - `npx vitest run src/workers/__tests__/filterPipeline.sharedBuffer.test` exits with code 0.
