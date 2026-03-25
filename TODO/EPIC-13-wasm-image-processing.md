# EPIC-13: WebAssembly for Image Processing (k-means + pixel ops)

## Summary
Replace hot JavaScript pixel loops and k-means quantization with Rust/WASM. Targets: k-means in `src/utils/kMeansWrapper.ts`, per-pixel filter loops in `src/utils/imageProcessing.ts`, and `sampleCircleAverage`. WASM + SIMD runs 10–50× faster for these workloads.

**Scope:** High-effort. Requires Rust toolchain (`rustup`) and `wasm-pack`.

---

## Tickets

- [ ] **TICKET-13-A:** Set up Rust/WASM toolchain and project scaffold

  Install `wasm-pack`. Create a Rust crate at `wasm/impasto-image-processing/` with a valid `Cargo.toml` and integrate the build output with Vite.

  **AC:**
  - `test -d wasm/impasto-image-processing && echo ok` prints `ok`.
  - `cd wasm/impasto-image-processing && wasm-pack build --target web` exits with code 0.
  - `ls wasm/impasto-image-processing/pkg/*.wasm` returns at least one file.
  - `npm run build` exits with code 0 with the WASM package present.

- [ ] **TICKET-13-B:** Implement `sample_circle_average` in Rust with tests

  Write a Rust function accepting a flat RGBA `&[u8]` buffer, width, height, center x/y, and radius. Return `[f64; 4]`. Export via `wasm-bindgen`. Include Rust unit tests with known pixel values.

  **AC:**
  - `cargo test --manifest-path wasm/impasto-image-processing/Cargo.toml` exits with code 0.
  - At least one Rust test covers a known-input → known-output case.
  - `npx tsc --noEmit` exits with code 0 (TS bindings compile).

- [ ] **TICKET-13-C:** Implement brightness/contrast/hue/saturation/levels in Rust with tests

  Port each per-pixel filter from `imageProcessing.ts` to Rust as a mutating `fn filter(buf: &mut [u8], ...)`. Include a Rust test for each filter asserting correct output for a known input pixel.

  **AC:**
  - `cargo test --manifest-path wasm/impasto-image-processing/Cargo.toml` exits with code 0.
  - Each filter has at least one Rust test case.

- [ ] **TICKET-13-D:** Write TypeScript parity tests comparing JS and WASM output

  For each filter, create a test that runs both the JS implementation and the WASM implementation on the same 10×10 `ImageData` and asserts the output buffers are identical (or within floating-point tolerance).

  **AC:**
  - Test file exists at `src/utils/__tests__/wasm-parity.test.ts`.
  - All filter parity tests pass.
  - `npx vitest run src/utils/__tests__/wasm-parity.test` exits with code 0.

- [ ] **TICKET-13-E:** Replace `ml-kmeans` with the Rust WASM implementation

  Update `src/utils/kMeansWrapper.ts` to call the WASM k-means function. Output format must match the existing interface consumed by callers.

  **AC:**
  - `grep -n "ml-kmeans" src/utils/kMeansWrapper.ts` returns no results.
  - `grep -n "wasm\|wasmKMeans" src/utils/kMeansWrapper.ts` returns results.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-13-F:** Write a benchmark script comparing WASM vs JS for a 1000×1000 image

  Create `scripts/benchmark-wasm.ts`. Run it with `npx tsx scripts/benchmark-wasm.ts`. Output should print timing in ms for both implementations.

  **AC:**
  - File exists at `scripts/benchmark-wasm.ts`.
  - `npx tsx scripts/benchmark-wasm.ts` exits with code 0 and prints timing results.
