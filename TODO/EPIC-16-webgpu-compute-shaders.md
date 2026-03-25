# EPIC-16: WebGPU Compute Shaders for Filter Chains

## Summary
Even WASM is single-threaded per core. A WebGPU compute shader runs the filter pipeline across thousands of GPU cores in parallel — a 4K image in WASM: ~40ms; same pipeline as a WebGPU shader: <1ms. Design toward this now by structuring filters as stateless buffer transforms. Browser support is Chrome 113+.

**Depends on:** EPIC-13 (WASM), EPIC-14 (instant preview pipeline)
**Scope:** Future architecture.

---

## Tickets

- [ ] **TICKET-16-A:** Audit filter functions for stateless transform compatibility

  Review all filter functions and confirm each is a pure `(inputBuffer, params) → outputBuffer` transform with no shared mutable state or side effects. Add a `@pure` JSDoc tag to each confirmed function.

  **AC:**
  - `grep -rn "@pure" src/utils/imageProcessing.ts` (and Rust source) returns one result per filter function.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-16-B:** Write unit tests asserting all filter functions are referentially transparent

  For each filter, call it twice with identical inputs and assert the output buffers are byte-for-byte identical. This codifies the stateless guarantee.

  **AC:**
  - Test file exists at `src/utils/__tests__/filter-purity.test.ts`.
  - Every filter has a dedicated test asserting deterministic output.
  - `npx vitest run src/utils/__tests__/filter-purity.test` exits with code 0.

- [ ] **TICKET-16-C:** Create a WGSL shader for the brightness/contrast filter

  Create `src/shaders/brightnessContrast.wgsl` with a compute shader that reads from a `storage` input buffer and writes to an output buffer.

  **AC:**
  - File exists at `src/shaders/brightnessContrast.wgsl`.
  - The file is valid WGSL: `npx wgsl-analyzer check src/shaders/brightnessContrast.wgsl` exits with code 0 (install `wgsl-analyzer` as a dev dependency if needed).
  - `npx tsc --noEmit` exits with code 0 (TS imports of the shader as a string).

- [ ] **TICKET-16-D:** Create WGSL shaders for hue/saturation and levels filters

  Same as TICKET-16-C for the remaining filter types.

  **AC:**
  - Files exist at `src/shaders/hueSaturation.wgsl` and `src/shaders/levels.wgsl`.
  - `npx wgsl-analyzer check src/shaders/hueSaturation.wgsl` exits with code 0.
  - `npx wgsl-analyzer check src/shaders/levels.wgsl` exits with code 0.

- [ ] **TICKET-16-E:** Write WGSL shader output parity tests against JS/WASM reference

  For each shader, create a test using a headless WebGPU environment (e.g. `@webgpu/types` + Dawn/wgpu Node bindings if available, or a CPU-side WGSL emulator) that runs the shader on a known input and asserts output matches the JS reference implementation.

  **AC:**
  - Test file exists at `src/shaders/__tests__/shader-parity.test.ts`.
  - Each shader has a parity test case.
  - `npx vitest run src/shaders/__tests__/shader-parity.test` exits with code 0.

- [ ] **TICKET-16-F:** Create `useWebGPUFilterPipeline` hook with `navigator.gpu` feature detection and WASM fallback

  Create `src/hooks/useWebGPUFilterPipeline.ts`. Detect `navigator.gpu`. If available, run the WebGPU pipeline; otherwise fall back to the WASM worker from EPIC-14. Expose the same `processFilters(filters): Promise<ImageBitmap>` interface regardless of path.

  **AC:**
  - File exists at `src/hooks/useWebGPUFilterPipeline.ts`.
  - `grep -n "navigator\.gpu\|fallback" src/hooks/useWebGPUFilterPipeline.ts` returns results for both branches.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-16-G:** Write unit test asserting WASM fallback is used when `navigator.gpu` is unavailable

  Delete `navigator.gpu` from the test environment (or set it to `undefined`). Call `useWebGPUFilterPipeline` and assert the WASM worker path is activated, not the GPU path.

  **AC:**
  - Test file exists at `src/hooks/__tests__/useWebGPUFilterPipeline.fallback.test.ts`.
  - WASM worker mock is called; WebGPU device mock is not called.
  - `npx vitest run src/hooks/__tests__/useWebGPUFilterPipeline.fallback.test` exits with code 0.
