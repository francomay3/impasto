use serde::{Deserialize, Serialize};
use ts_rs::TS;
use crate::filters;

/// Wire JSON for one pipeline step: `{ "type": "<filter-id>", "params": { … } }`, matching
/// `src/types/index.ts` (`FilterInstance.type` + `FilterInstance.params`).
///
/// The worker posts `JSON.stringify([filter])` where each object also includes `id` (and optional
/// `enabled`); serde ignores those extra keys when deserializing into this enum.
///
/// **PLAN.md** called for `#[serde(tag = "type", rename_all = "camelCase")]` only; that form is
/// *internally* tagged (params flattened next to `type`) and does **not** match the real TS/JSON
/// shape, which nests params under `params`. We keep adjacent tagging: `tag` + `content = "params"`.
#[derive(Debug, Clone, TS, Serialize, Deserialize)]
#[serde(tag = "type", content = "params")]
pub enum FilterInstance {
    #[serde(rename = "brightness-contrast")]
    BrightnessContrast(filters::BrightnessContrastParams),
    #[serde(rename = "hue-saturation")]
    HueSaturation(filters::HueSaturationParams),
    #[serde(rename = "white-balance")]
    WhiteBalance(filters::WhiteBalanceParams),
    #[serde(rename = "vibrance")]
    Vibrance(filters::VibranceParams),
    #[serde(rename = "color-balance")]
    ColorBalance(filters::ColorBalanceParams),
    #[serde(rename = "levels")]
    Levels(filters::LevelsParams),
    #[serde(rename = "blur")]
    Blur(filters::BlurParams),
}

/// Legacy copy-based API: allocates once, then applies all filters in-place.
/// Kept for backward compatibility with the existing `apply_pipeline` export.
pub fn run(pixels: &[u8], width: u32, height: u32, filters_json: &str) -> Vec<u8> {
    let ops: Vec<FilterInstance> = match serde_json::from_str(filters_json) {
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
    let ops: Vec<FilterInstance> = match serde_json::from_str(filters_json) {
        Ok(v) => v,
        Err(_) => return,
    };
    apply_ops(pixels, width, height, ops);
}

fn apply_ops(pixels: &mut [u8], width: u32, height: u32, ops: Vec<FilterInstance>) {
    for op in ops {
        match op {
            FilterInstance::BrightnessContrast(p) => filters::brightness_contrast(pixels, p),
            FilterInstance::HueSaturation(p) => filters::hue_saturation(pixels, p),
            FilterInstance::WhiteBalance(p) => filters::white_balance(pixels, p),
            FilterInstance::Vibrance(p) => filters::vibrance(pixels, p),
            FilterInstance::ColorBalance(p) => filters::color_balance(pixels, p),
            FilterInstance::Levels(p) => filters::levels(pixels, p),
            FilterInstance::Blur(p) => filters::blur(pixels, width, height, p.blur),
        }
    }
}

#[cfg(test)]
mod filter_instance_json_tests {
    use super::FilterInstance;

    fn assert_f32_close(a: f32, b: f32) {
        assert!(
            (a - b).abs() < 1e-4,
            "expected {a:?} ≈ {b:?} (diff {:?})",
            (a - b).abs()
        );
    }

    /// Mirrors `src/types/index.ts` + `img-pipeline.worker.ts`: each step is one object with
    /// `id`, `type`, nested `params`, and optional `enabled`; WASM only deserializes `type` + `params`.
    #[test]
    fn filter_instance_round_trips_worker_brightness_json() {
        let json = r#"{
            "id": "a1b2c3",
            "type": "brightness-contrast",
            "params": { "brightness": 12.5, "contrast": -3.0 },
            "enabled": true
        }"#;

        let parsed: FilterInstance = serde_json::from_str(json).expect("deserialize from TS shape");
        let serialized = serde_json::to_string(&parsed).expect("serialize");
        let again: FilterInstance = serde_json::from_str(&serialized).expect("deserialize round-trip");

        assert_eq!(
            serialized,
            serde_json::to_string(&again).expect("serialize again"),
            "serde_json output should be stable across a second round-trip"
        );

        match (&parsed, &again) {
            (
                FilterInstance::BrightnessContrast(p0),
                FilterInstance::BrightnessContrast(p1),
            ) => {
                assert_f32_close(p0.brightness, 12.5);
                assert_f32_close(p0.contrast, -3.0);
                assert_f32_close(p1.brightness, p0.brightness);
                assert_f32_close(p1.contrast, p0.contrast);
            }
            _ => panic!("expected BrightnessContrast, got {parsed:?} / {again:?}"),
        }
    }

    /// `ColorBalanceParams` uses `#[serde(rename = "...")]` for TS camelCase field names.
    #[test]
    fn filter_instance_round_trips_color_balance_camel_case_params() {
        let json = r#"{
            "id": "cb-1",
            "type": "color-balance",
            "params": {
                "shadowsR": 1.0, "shadowsG": 2.0, "shadowsB": 3.0,
                "midtonesR": 4.0, "midtonesG": 5.0, "midtonesB": 6.0,
                "highlightsR": 7.0, "highlightsG": 8.0, "highlightsB": 9.0,
                "preserveLuminosity": 1.0
            }
        }"#;

        let parsed: FilterInstance = serde_json::from_str(json).expect("parse color-balance");
        let again: FilterInstance =
            serde_json::from_str(&serde_json::to_string(&parsed).expect("ser")).expect("re-parse");

        match (&parsed, &again) {
            (FilterInstance::ColorBalance(p0), FilterInstance::ColorBalance(p1)) => {
                assert_f32_close(p0.shadows_r, 1.0);
                assert_f32_close(p0.preserve_luminosity, 1.0);
                assert_f32_close(p1.highlights_b, p0.highlights_b);
            }
            _ => panic!("expected ColorBalance: {parsed:?}"),
        }
    }

    #[test]
    fn filter_instance_round_trips_levels_black_white_point_keys() {
        let json = r#"{"type":"levels","params":{"blackPoint":5,"whitePoint":240}}"#;
        let parsed: FilterInstance = serde_json::from_str(json).unwrap();
        let again: FilterInstance =
            serde_json::from_str(&serde_json::to_string(&parsed).unwrap()).unwrap();
        match (&parsed, &again) {
            (FilterInstance::Levels(p0), FilterInstance::Levels(p1)) => {
                assert_f32_close(p0.black_point, 5.0);
                assert_f32_close(p0.white_point, 240.0);
                assert_f32_close(p1.black_point, p0.black_point);
            }
            _ => panic!("expected Levels"),
        }
    }
}

/// Emits `FilterInstance` + filter param types into `src/wasm/generated/` (see epic PLAN Phase 2).
#[cfg(test)]
mod export_ts_bindings {
    use std::path::PathBuf;

    use ts_rs::TS;

    use super::FilterInstance;

    #[test]
    fn export_filter_instance_and_deps_to_wasm_generated() {
        let out_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../src/wasm/generated");
        FilterInstance::export_all_to(&out_dir).expect("export FilterInstance and dependencies");
    }
}
