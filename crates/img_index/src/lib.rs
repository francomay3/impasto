mod index;
mod lut;

pub use index::IndexedPaletteLab;

use std::cell::RefCell;
use wasm_bindgen::prelude::*;

// Persistent pixel buffer for the zero-copy index path (Phase 3). Same lifetime
// and single-threaded WASM assumptions as `img_ops::IMAGE_BUFFER`.
thread_local! {
    static INDEX_BUFFER: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
}

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

// ── Zero-copy buffer API (worker will write pixels, then `process_index_inplace`) ─

/// Ensures the internal buffer holds at least `width × height × 4` bytes,
/// growing only when the requested size exceeds the current length, and returns
/// the pointer to its start for a `Uint8Array` view over `memory.buffer`.
#[wasm_bindgen]
pub fn request_index_buffer(width: u32, height: u32) -> u32 {
    let size = (width * height * 4) as usize;
    INDEX_BUFFER.with(|buf| {
        let mut b = buf.borrow_mut();
        if b.len() < size {
            b.resize(size, 0);
        }
        b.as_mut_ptr() as u32
    })
}

/// Expected byte length for `width × height` RGBA, or `None` if dimensions overflow.
fn rgba_byte_len(width: u32, height: u32) -> Option<usize> {
    let w = width as u64;
    let h = height as u64;
    let bytes = w.checked_mul(h)?.checked_mul(4)?;
    usize::try_from(bytes).ok()
}

/// Blur + palette remap on `pixels` (same semantics as [`apply_index`]).
///
/// If `pixels.len()` ≠ `width × height × 4`, or the palette is empty / invalid JSON, `pixels` is
/// left unchanged. Used by [`process_index_inplace`] and by unit tests (native pointers are not
/// representable as `u32`, so tests call this instead of the wasm export).
pub(crate) fn process_index_inplace_slice(
    pixels: &mut [u8],
    width: u32,
    height: u32,
    sigma: f32,
    palette_json: &str,
) {
    let Some(expected) = rgba_byte_len(width, height) else {
        return;
    };
    if pixels.len() != expected {
        return;
    }

    let palette = match index::parse_palette(palette_json) {
        Some(p) if !p.is_empty() => p,
        _ => return,
    };

    let blurred = img_blur::gaussian_blur(pixels, width, height, sigma);
    let out = index::remap(&blurred, &palette);
    debug_assert_eq!(out.len(), pixels.len());

    pixels.copy_from_slice(&out);
}

/// Blur + palette remap on pixels already in WASM linear memory at `[ptr, ptr+len)`.
///
/// Same processing as [`apply_index`]. If `len` ≠ `width × height × 4`, or the palette is empty
/// / invalid JSON, the region is left unchanged (matches `apply_index` returning the input copy).
///
/// SAFETY: `ptr` must be valid for `len` bytes read/write for the call duration (typically the
/// pointer from [`request_index_buffer`] after the worker wrote RGBA into it).
#[wasm_bindgen]
pub fn process_index_inplace(
    ptr: u32,
    len: u32,
    width: u32,
    height: u32,
    sigma: f32,
    palette_json: &str,
) {
    let Some(expected) = rgba_byte_len(width, height) else {
        return;
    };
    if len as usize != expected {
        return;
    }

    let slice = unsafe { std::slice::from_raw_parts_mut(ptr as *mut u8, len as usize) };
    process_index_inplace_slice(slice, width, height, sigma, palette_json);
}

#[cfg(test)]
mod process_index_inplace_tests {
    use super::*;

    #[test]
    fn inplace_matches_apply_index() {
        let w = 2u32;
        let h = 2u32;
        let mut pixels: Vec<u8> = vec![
            255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 128, 128, 128, 255,
        ];
        let palette = r#"[{"l":50,"a":2,"b":-3},{"l":10,"a":0,"b":0}]"#;
        let sigma = 0.8_f32;

        let expected = apply_index(&pixels, w, h, sigma, palette);

        process_index_inplace_slice(&mut pixels, w, h, sigma, palette);

        assert_eq!(pixels, expected);
    }

    #[test]
    fn wrong_len_is_no_op() {
        let mut pixels = vec![1u8, 2, 3, 4];
        let backup = pixels.clone();
        process_index_inplace_slice(
            &mut pixels,
            2,
            2,
            1.0,
            r#"[{"l":50,"a":0,"b":0}]"#,
        );
        assert_eq!(pixels, backup);
    }

    #[test]
    fn empty_palette_is_no_op() {
        let mut pixels = vec![10u8, 20, 30, 40];
        let backup = pixels.clone();
        process_index_inplace_slice(&mut pixels, 1, 1, 1.0, "[]");
        assert_eq!(pixels, backup);
    }
}

/// Writes `IndexedPaletteLab.ts` into `src/wasm/generated/` (see epic PLAN Phase 2).
#[cfg(test)]
mod export_ts_bindings {
    use std::path::PathBuf;

    use ts_rs::TS;

    use crate::IndexedPaletteLab;

    #[test]
    fn export_indexed_palette_lab_to_wasm_generated() {
        let out_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../src/wasm/generated");
        IndexedPaletteLab::export_all_to(&out_dir).expect("export IndexedPaletteLab");
    }
}
