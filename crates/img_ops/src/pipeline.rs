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

pub fn run(pixels: &[u8], width: u32, height: u32, filters_json: &str) -> Vec<u8> {
    let ops: Vec<FilterOp> = match serde_json::from_str(filters_json) {
        Ok(v) => v,
        Err(_) => return pixels.to_vec(),
    };

    ops.into_iter().fold(pixels.to_vec(), |data, op| match op {
        FilterOp::BrightnessContrast(p) => filters::brightness_contrast(&data, p),
        FilterOp::HueSaturation(p) => filters::hue_saturation(&data, p),
        FilterOp::Levels(p) => filters::levels(&data, p),
        FilterOp::Blur(p) => img_blur::gaussian_blur(&data, width, height, p.blur),
    })
}
