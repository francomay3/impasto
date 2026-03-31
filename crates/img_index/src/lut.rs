use palette::{IntoColor, Lab, Srgb};
use palette::color_difference::Ciede2000;

/// Grid resolution per channel. 32^3 = 32 768 cells.
/// Each cell covers ~8.2 sRGB steps, well below perceptible quantisation error.
const RES: usize = 32;

/// Pre-computed sRGB → palette lookup table.
/// For each quantised (r, g, b) grid cell, stores the nearest palette
/// color as packed (r, g, b) u8 values.
pub struct PaletteLut {
    data: Vec<[u8; 3]>,
}

impl PaletteLut {
    pub fn build(palette: &[Lab]) -> Self {
        let mut data = vec![[0u8; 3]; RES * RES * RES];
        for ri in 0..RES {
            for gi in 0..RES {
                for bi in 0..RES {
                    let r = ri as f32 / (RES - 1) as f32;
                    let g = gi as f32 / (RES - 1) as f32;
                    let b = bi as f32 / (RES - 1) as f32;
                    let lab: Lab = Srgb::new(r, g, b).into_color();
                    let nearest = palette
                        .iter()
                        .copied()
                        .min_by(|x, y| {
                            lab.difference(*x)
                                .partial_cmp(&lab.difference(*y))
                                .unwrap_or(std::cmp::Ordering::Equal)
                        })
                        .unwrap();
                    let out: Srgb<f32> = nearest.into_color();
                    data[ri * RES * RES + gi * RES + bi] = [
                        (out.red   * 255.0).round().clamp(0.0, 255.0) as u8,
                        (out.green * 255.0).round().clamp(0.0, 255.0) as u8,
                        (out.blue  * 255.0).round().clamp(0.0, 255.0) as u8,
                    ];
                }
            }
        }
        Self { data }
    }

    /// Round each channel to the nearest grid index and return the cached output.
    #[inline]
    pub fn lookup(&self, r: u8, g: u8, b: u8) -> [u8; 3] {
        // Integer rounding: round(v * (RES-1) / 255)
        let ri = (r as usize * (RES - 1) + 127) / 255;
        let gi = (g as usize * (RES - 1) + 127) / 255;
        let bi = (b as usize * (RES - 1) + 127) / 255;
        self.data[ri * RES * RES + gi * RES + bi]
    }
}
