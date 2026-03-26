mod filters;
mod pipeline;

use wasm_bindgen::prelude::*;

/// Applies a JSON-encoded FilterInstance[] pipeline to raw RGBA pixel data.
/// The JSON shape matches the TypeScript FilterInstance[] type directly.
#[wasm_bindgen]
pub fn apply_pipeline(pixels: &[u8], width: u32, height: u32, filters_json: &str) -> Vec<u8> {
    pipeline::run(pixels, width, height, filters_json)
}
