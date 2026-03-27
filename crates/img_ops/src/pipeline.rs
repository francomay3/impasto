use serde::Deserialize;
use crate::filters;

/// Mirrors the TypeScript FilterInstance union — `type` + `params` are adjacently tagged.
/// Unknown fields (e.g. `id`) are ignored by serde by default.
#[derive(Deserialize)]
#[serde(tag = "type", content = "params")]
enum FilterOp {
    #[serde(rename = "brightness-contrast")]
    BrightnessContrast(filters::BrightnessContrastParams),
    #[serde(rename = "hue-saturation")]
    HueSaturation(filters::HueSaturationParams),
    #[serde(rename = "levels")]
    Levels(filters::LevelsParams),
    #[serde(rename = "blur")]
    Blur(filters::BlurParams),
}

/// Legacy copy-based API: allocates once, then applies all filters in-place.
/// Kept for backward compatibility with the existing `apply_pipeline` export.
pub fn run(pixels: &[u8], width: u32, height: u32, filters_json: &str) -> Vec<u8> {
    let ops: Vec<FilterOp> = match serde_json::from_str(filters_json) {
        Ok(v) => v,
        Err(_) => return pixels.to_vec(),
    };
    let mut data = pixels.to_vec();
    apply_ops(&mut data, width, height, ops);
    data
}

/// Zero-copy path: operates directly on an existing mutable slice.
/// Used by `process_inplace` which points at the persistent IMAGE_BUFFER.
pub fn run_inplace(pixels: &mut [u8], width: u32, height: u32, filters_json: &str) {
    let ops: Vec<FilterOp> = match serde_json::from_str(filters_json) {
        Ok(v) => v,
        Err(_) => return,
    };
    apply_ops(pixels, width, height, ops);
}

fn apply_ops(pixels: &mut [u8], width: u32, height: u32, ops: Vec<FilterOp>) {
    for op in ops {
        match op {
            FilterOp::BrightnessContrast(p) => filters::brightness_contrast(pixels, p),
            FilterOp::HueSaturation(p) => filters::hue_saturation(pixels, p),
            FilterOp::Levels(p) => filters::levels(pixels, p),
            FilterOp::Blur(p) => filters::blur(pixels, width, height, p.blur),
        }
    }
}
