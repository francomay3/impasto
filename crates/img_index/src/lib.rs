mod index;

use wasm_bindgen::prelude::*;

/// Blurs the image by `blur_sigma`, then maps every pixel to the nearest
/// palette entry using delta E 2000.
///
/// `palette_json` — JSON array of `{ "l": f32, "a": f32, "b": f32 }` entries
/// in standard CIE Lab scale (L: 0-100, a/b: ~-128 to 127).
///
/// Returns remapped RGBA pixels; alpha channel is preserved from input.
#[wasm_bindgen]
pub fn apply_index(
    pixels: &[u8],
    width: u32,
    height: u32,
    blur_sigma: f32,
    palette_json: &str,
) -> Vec<u8> {
    let palette = match index::parse_palette(palette_json) {
        Some(p) if !p.is_empty() => p,
        _ => return pixels.to_vec(),
    };
    let blurred = img_blur::gaussian_blur(pixels, width, height, blur_sigma);
    index::remap(&blurred, &palette)
}
