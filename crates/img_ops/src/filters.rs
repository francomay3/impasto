use serde::Deserialize;

#[derive(Deserialize)]
pub struct BrightnessContrastParams {
    pub brightness: f32,
    pub contrast: f32,
}

#[derive(Deserialize)]
pub struct HueSaturationParams {
    pub hue: f32,
    pub saturation: f32,
    pub lightness: f32,
}

#[derive(Deserialize)]
pub struct WhiteBalanceParams {
    pub temperature: f32,
    pub tint: f32,
}

#[derive(Deserialize)]
pub struct VibranceParams {
    pub vibrance: f32,
    pub saturation: f32,
}

#[derive(Deserialize)]
pub struct ColorBalanceParams {
    #[serde(rename = "shadowsR")] pub shadows_r: f32,
    #[serde(rename = "shadowsG")] pub shadows_g: f32,
    #[serde(rename = "shadowsB")] pub shadows_b: f32,
    #[serde(rename = "midtonesR")] pub midtones_r: f32,
    #[serde(rename = "midtonesG")] pub midtones_g: f32,
    #[serde(rename = "midtonesB")] pub midtones_b: f32,
    #[serde(rename = "highlightsR")] pub highlights_r: f32,
    #[serde(rename = "highlightsG")] pub highlights_g: f32,
    #[serde(rename = "highlightsB")] pub highlights_b: f32,
    #[serde(rename = "preserveLuminosity")] pub preserve_luminosity: f32,
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

fn rgb_to_hsl(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let r = r / 255.0;
    let g = g / 255.0;
    let b = b / 255.0;
    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let l = (max + min) / 2.0;
    if max == min {
        return (0.0, 0.0, l);
    }
    let d = max - min;
    let s = if l > 0.5 { d / (2.0 - max - min) } else { d / (max + min) };
    let h = if max == r {
        (g - b) / d + if g < b { 6.0 } else { 0.0 }
    } else if max == g {
        (b - r) / d + 2.0
    } else {
        (r - g) / d + 4.0
    };
    (h / 6.0, s, l)
}

fn hue_to_rgb(p: f32, q: f32, mut t: f32) -> f32 {
    if t < 0.0 { t += 1.0; }
    if t > 1.0 { t -= 1.0; }
    if t < 1.0 / 6.0 { return p + (q - p) * 6.0 * t; }
    if t < 0.5 { return q; }
    if t < 2.0 / 3.0 { return p + (q - p) * (2.0 / 3.0 - t) * 6.0; }
    p
}

fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (f32, f32, f32) {
    if s == 0.0 {
        let v = l * 255.0;
        return (v, v, v);
    }
    let q = if l < 0.5 { l * (1.0 + s) } else { l + s - l * s };
    let p = 2.0 * l - q;
    (
        hue_to_rgb(p, q, h + 1.0 / 3.0) * 255.0,
        hue_to_rgb(p, q, h) * 255.0,
        hue_to_rgb(p, q, h - 1.0 / 3.0) * 255.0,
    )
}

pub fn brightness_contrast(pixels: &mut [u8], p: BrightnessContrastParams) {
    let cf = (259.0 * (p.contrast + 255.0)) / (255.0 * (259.0 - p.contrast));
    for chunk in pixels.chunks_exact_mut(4) {
        for c in 0..3 {
            let v = cf * (chunk[c] as f32 + p.brightness - 128.0) + 128.0;
            chunk[c] = v.clamp(0.0, 255.0) as u8;
        }
    }
}

pub fn hue_saturation(pixels: &mut [u8], p: HueSaturationParams) {
    let hue_shift = p.hue / 360.0;
    let sat_shift = p.saturation / 100.0;
    let light_shift = p.lightness / 100.0;
    // Fast path: no hue rotation → skip the HSL round-trip entirely.
    // Saturation uses direct luminance blend; lightness shifts all channels uniformly.
    if hue_shift == 0.0 {
        let sat_mul = (p.saturation + 100.0) / 100.0;
        let light_add = p.lightness * 2.55; // map [-100,100] → [-255,255]
        for chunk in pixels.chunks_exact_mut(4) {
            let r = chunk[0] as f32;
            let g = chunk[1] as f32;
            let b = chunk[2] as f32;
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            chunk[0] = (gray + sat_mul * (r - gray) + light_add).clamp(0.0, 255.0) as u8;
            chunk[1] = (gray + sat_mul * (g - gray) + light_add).clamp(0.0, 255.0) as u8;
            chunk[2] = (gray + sat_mul * (b - gray) + light_add).clamp(0.0, 255.0) as u8;
        }
        return;
    }
    for chunk in pixels.chunks_exact_mut(4) {
        let (mut h, mut s, mut l) = rgb_to_hsl(chunk[0] as f32, chunk[1] as f32, chunk[2] as f32);
        h = (h + hue_shift).rem_euclid(1.0);
        s = (s + sat_shift).clamp(0.0, 1.0);
        l = (l + light_shift).clamp(0.0, 1.0);
        let (r, g, b) = hsl_to_rgb(h, s, l);
        chunk[0] = r.clamp(0.0, 255.0) as u8;
        chunk[1] = g.clamp(0.0, 255.0) as u8;
        chunk[2] = b.clamp(0.0, 255.0) as u8;
    }
}

pub fn white_balance(pixels: &mut [u8], p: WhiteBalanceParams) {
    for chunk in pixels.chunks_exact_mut(4) {
        let r = chunk[0] as f32 + p.temperature;
        let g = chunk[1] as f32 + p.tint;
        let b = chunk[2] as f32 - p.temperature;
        chunk[0] = r.clamp(0.0, 255.0) as u8;
        chunk[1] = g.clamp(0.0, 255.0) as u8;
        chunk[2] = b.clamp(0.0, 255.0) as u8;
    }
}

pub fn vibrance(pixels: &mut [u8], p: VibranceParams) {
    let sat_mul = (p.saturation + 100.0) / 100.0;
    for chunk in pixels.chunks_exact_mut(4) {
        let r = chunk[0] as f32;
        let g = chunk[1] as f32;
        let b = chunk[2] as f32;
        let max = r.max(g).max(b);
        let min = r.min(g).min(b);
        let current_sat = if max > 0.0 { (max - min) / max } else { 0.0 };
        let vib_mul = 1.0 + (p.vibrance / 100.0) * (1.0 - current_sat);
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        let factor = sat_mul * vib_mul;
        chunk[0] = (gray + factor * (r - gray)).clamp(0.0, 255.0) as u8;
        chunk[1] = (gray + factor * (g - gray)).clamp(0.0, 255.0) as u8;
        chunk[2] = (gray + factor * (b - gray)).clamp(0.0, 255.0) as u8;
    }
}

pub fn color_balance(pixels: &mut [u8], p: ColorBalanceParams) {
    for chunk in pixels.chunks_exact_mut(4) {
        let r = chunk[0] as f32;
        let g = chunk[1] as f32;
        let b = chunk[2] as f32;
        let l = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
        let sm = (1.0 - l).powi(2);
        let mm = 1.0 - (2.0 * l - 1.0).powi(2);
        let hm = l.powi(2);
        let mut nr = (r + (p.shadows_r * sm + p.midtones_r * mm + p.highlights_r * hm) * 0.5).clamp(0.0, 255.0);
        let mut ng = (g + (p.shadows_g * sm + p.midtones_g * mm + p.highlights_g * hm) * 0.5).clamp(0.0, 255.0);
        let mut nb = (b + (p.shadows_b * sm + p.midtones_b * mm + p.highlights_b * hm) * 0.5).clamp(0.0, 255.0);
        if p.preserve_luminosity != 0.0 {
            let orig_lum = 0.299 * r + 0.587 * g + 0.114 * b;
            let new_lum = 0.299 * nr + 0.587 * ng + 0.114 * nb;
            if new_lum > 0.0 {
                let scale = orig_lum / new_lum;
                nr = (nr * scale).clamp(0.0, 255.0);
                ng = (ng * scale).clamp(0.0, 255.0);
                nb = (nb * scale).clamp(0.0, 255.0);
            }
        }
        chunk[0] = nr as u8;
        chunk[1] = ng as u8;
        chunk[2] = nb as u8;
    }
}

pub fn levels(pixels: &mut [u8], p: LevelsParams) {
    let range = (p.white_point - p.black_point).max(1.0);
    for chunk in pixels.chunks_exact_mut(4) {
        for c in 0..3 {
            let v = (chunk[c] as f32 - p.black_point) / range * 255.0;
            chunk[c] = v.clamp(0.0, 255.0) as u8;
        }
    }
}

/// Blur allocates internally (fastblur constraint) but copies the result back
/// in-place, so the caller's buffer is updated without extra JS-side copies.
pub fn blur(pixels: &mut [u8], width: u32, height: u32, sigma: f32) {
    let blurred = img_blur::gaussian_blur(pixels, width, height, sigma);
    pixels.copy_from_slice(&blurred);
}
