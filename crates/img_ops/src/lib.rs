mod filters;
mod pipeline;

use std::cell::RefCell;
use wasm_bindgen::prelude::*;

// Persistent pixel buffer. Lives for the lifetime of the WASM instance.
// WASM is single-threaded, so RefCell<Vec<u8>> is the safe pattern here.
thread_local! {
    static IMAGE_BUFFER: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
}

// ── Legacy copy-based API (kept for backward compat) ─────────────────────────

/// Applies a JSON-encoded FilterInstance[] pipeline to raw RGBA pixel data.
/// Allocates once (input clone) then processes all filters in-place.
#[wasm_bindgen]
pub fn apply_pipeline(pixels: &[u8], width: u32, height: u32, filters_json: &str) -> Vec<u8> {
    pipeline::run(pixels, width, height, filters_json)
}

// ── Zero-copy API ─────────────────────────────────────────────────────────────

/// Returns the raw pointer to the persistent internal pixel buffer.
/// Always call `request_buffer` first to guarantee the buffer is sized correctly.
#[wasm_bindgen]
pub fn get_buffer_ptr() -> u32 {
    IMAGE_BUFFER.with(|buf| buf.borrow().as_ptr() as u32)
}

/// Ensures the internal buffer holds at least `width × height × 4` bytes,
/// resizing only when necessary, and returns the pointer to its start.
///
/// JS usage:
///   const ptr = request_buffer(width, height);
///   new Uint8Array(memory.buffer, ptr, width * height * 4).set(imageData.data);
#[wasm_bindgen]
pub fn request_buffer(width: u32, height: u32) -> u32 {
    let size = (width * height * 4) as usize;
    IMAGE_BUFFER.with(|buf| {
        let mut b = buf.borrow_mut();
        if b.len() < size {
            b.resize(size, 0);
        }
        b.as_mut_ptr() as u32
    })
}

/// Applies JSON-encoded filters in-place on the WASM memory region [ptr, ptr+len).
///
/// Prerequisites:
///   1. `request_buffer(width, height)` was called and returned `ptr`.
///   2. Canvas pixel data was written to `ptr` via a Uint8Array view on `memory.buffer`.
///
/// SAFETY: ptr must originate from `request_buffer`. len must equal width×height×4.
/// WASM is single-threaded — no concurrent access is possible.
#[wasm_bindgen]
pub fn process_inplace(ptr: u32, len: u32, width: u32, height: u32, filters_json: &str) {
    let pixels = unsafe { std::slice::from_raw_parts_mut(ptr as *mut u8, len as usize) };
    pipeline::run_inplace(pixels, width, height, filters_json);
}
