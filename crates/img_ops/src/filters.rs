use serde::Deserialize;

#[derive(Deserialize)]
pub struct BrightnessContrastParams {
    pub brightness: f32,
    pub contrast: f32,
}

#[derive(Deserialize)]
pub struct HueSaturationParams {
    pub saturation: f32,
    pub temperature: f32,
    pub tint: f32,
}

#[derive(Deserialize)]
pub struct LevelsParams {
    #[serde(rename = "blackPoint")]
    pub black_point: f32,
    #[serde(rename = "whitePoint")]
    pub white_point: f32,
}

#[derive(Deserialize)]
pub struct BlurParams {
    pub blur: f32,
}

pub fn brightness_contrast(pixels: &[u8], p: BrightnessContrastParams) -> Vec<u8> {
    let mut out = pixels.to_vec();
    let cf = (259.0 * (p.contrast + 255.0)) / (255.0 * (259.0 - p.contrast));
    for chunk in out.chunks_mut(4) {
        for c in 0..3 {
            let v = cf * (chunk[c] as f32 + p.brightness - 128.0) + 128.0;
            chunk[c] = v.clamp(0.0, 255.0) as u8;
        }
    }
    out
}

pub fn hue_saturation(pixels: &[u8], p: HueSaturationParams) -> Vec<u8> {
    let mut out = pixels.to_vec();
    let sat = (p.saturation + 100.0) / 100.0;
    for chunk in out.chunks_mut(4) {
        let r = chunk[0] as f32 + p.temperature;
        let g = chunk[1] as f32 + p.tint;
        let b = chunk[2] as f32 - p.temperature;
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        chunk[0] = (gray + sat * (r - gray)).clamp(0.0, 255.0) as u8;
        chunk[1] = (gray + sat * (g - gray)).clamp(0.0, 255.0) as u8;
        chunk[2] = (gray + sat * (b - gray)).clamp(0.0, 255.0) as u8;
    }
    out
}

pub fn levels(pixels: &[u8], p: LevelsParams) -> Vec<u8> {
    let mut out = pixels.to_vec();
    let range = (p.white_point - p.black_point).max(1.0);
    for chunk in out.chunks_mut(4) {
        for c in 0..3 {
            let v = (chunk[c] as f32 - p.black_point) / range * 255.0;
            chunk[c] = v.clamp(0.0, 255.0) as u8;
        }
    }
    out
}
