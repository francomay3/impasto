use palette::{IntoColor, Lab, Srgb};
use palette::color_difference::Ciede2000;
use serde::Deserialize;

#[derive(Deserialize)]
struct RawLab {
    l: f32,
    a: f32,
    b: f32,
}

pub fn parse_palette(json: &str) -> Option<Vec<Lab>> {
    let raw: Vec<RawLab> = serde_json::from_str(json).ok()?;
    Some(raw.into_iter().map(|c| Lab::new(c.l, c.a, c.b)).collect())
}

pub fn remap(pixels: &[u8], palette: &[Lab]) -> Vec<u8> {
    let mut out = pixels.to_vec();
    for chunk in out.chunks_mut(4) {
        let srgb: Srgb<f32> = Srgb::new(
            chunk[0] as f32 / 255.0,
            chunk[1] as f32 / 255.0,
            chunk[2] as f32 / 255.0,
        );
        let lab: Lab = srgb.into_color();
        let nearest = palette
            .iter()
            .copied()
            .min_by(|a, b| {
                lab.difference(*a)
                    .partial_cmp(&lab.difference(*b))
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .unwrap_or(lab);
        let out_srgb: Srgb<f32> = nearest.into_color();
        chunk[0] = (out_srgb.red   * 255.0).round().clamp(0.0, 255.0) as u8;
        chunk[1] = (out_srgb.green * 255.0).round().clamp(0.0, 255.0) as u8;
        chunk[2] = (out_srgb.blue  * 255.0).round().clamp(0.0, 255.0) as u8;
        // chunk[3] alpha is preserved
    }
    out
}
