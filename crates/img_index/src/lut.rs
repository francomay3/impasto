use palette::{IntoColor, Lab, Srgb};
use palette::color_difference::Ciede2000;

/// Grid resolution per channel. 32^3 = 32 768 cells.
const RES: usize = 32;

/// Pre-computed sRGB → palette lookup table.
///
/// Most pixels hit the fast path (cached RGB). Cells on a Voronoi boundary
/// between two palette colors are marked `ambiguous` and fall back to an exact
/// per-pixel search using squared Euclidean Lab distance, eliminating
/// quantisation artefacts at colour transitions. The fallback avoids all trig
/// (no atan2/sin/cos/pow), so it is ~10× faster than CIEDE2000 while still
/// being perceptually accurate enough for boundary disambiguation.
pub struct PaletteLut {
    data: Vec<[u8; 3]>,
    ambiguous: Vec<bool>,
    palette: Vec<Lab>,
}

impl PaletteLut {
    pub fn build(palette: &[Lab]) -> Self {
        let n = RES * RES * RES;
        let mut data = vec![[0u8; 3]; n];
        let mut idx = vec![0u8; n];

        for ri in 0..RES {
            for gi in 0..RES {
                for bi in 0..RES {
                    let lab: Lab = Srgb::new(
                        ri as f32 / (RES - 1) as f32,
                        gi as f32 / (RES - 1) as f32,
                        bi as f32 / (RES - 1) as f32,
                    ).into_color();
                    let (pi, nearest) = palette
                        .iter()
                        .copied()
                        .enumerate()
                        .min_by(|(_, x), (_, y)| {
                            lab.difference(*x)
                                .partial_cmp(&lab.difference(*y))
                                .unwrap_or(std::cmp::Ordering::Equal)
                        })
                        .unwrap();
                    let out: Srgb<f32> = nearest.into_color();
                    let cell = ri * RES * RES + gi * RES + bi;
                    data[cell] = [
                        (out.red   * 255.0).round().clamp(0.0, 255.0) as u8,
                        (out.green * 255.0).round().clamp(0.0, 255.0) as u8,
                        (out.blue  * 255.0).round().clamp(0.0, 255.0) as u8,
                    ];
                    idx[cell] = pi as u8;
                }
            }
        }

        let ambiguous = mark_boundary_cells(&idx);
        Self { data, ambiguous, palette: palette.to_vec() }
    }

    #[inline]
    pub fn lookup(&self, r: u8, g: u8, b: u8) -> [u8; 3] {
        let ri = (r as usize * (RES - 1) + 127) / 255;
        let gi = (g as usize * (RES - 1) + 127) / 255;
        let bi = (b as usize * (RES - 1) + 127) / 255;
        let cell = ri * RES * RES + gi * RES + bi;
        if !self.ambiguous[cell] {
            return self.data[cell];
        }
        exact_nearest(r as f32 / 255.0, g as f32 / 255.0, b as f32 / 255.0, &self.palette)
    }
}

fn mark_boundary_cells(idx: &[u8]) -> Vec<bool> {
    let mut ambiguous = vec![false; RES * RES * RES];
    const OFFSETS: [(isize, isize, isize); 6] = [
        (-1, 0, 0), (1, 0, 0),
        (0, -1, 0), (0, 1, 0),
        (0, 0, -1), (0, 0, 1),
    ];
    for ri in 0..RES {
        for gi in 0..RES {
            for bi in 0..RES {
                let cell = ri * RES * RES + gi * RES + bi;
                let my_idx = idx[cell];
                'neighbors: for (dr, dg, db) in OFFSETS {
                    let nr = ri as isize + dr;
                    let ng = gi as isize + dg;
                    let nb = bi as isize + db;
                    if nr < 0 || nr >= RES as isize
                        || ng < 0 || ng >= RES as isize
                        || nb < 0 || nb >= RES as isize
                    {
                        continue;
                    }
                    let ncell = nr as usize * RES * RES + ng as usize * RES + nb as usize;
                    if idx[ncell] != my_idx {
                        ambiguous[cell] = true;
                        break 'neighbors;
                    }
                }
            }
        }
    }
    ambiguous
}

/// Finds the nearest palette color using squared Euclidean Lab distance.
/// Used only for boundary-cell pixels. Avoids all trig ops (atan2/sin/cos/pow)
/// present in CIEDE2000, while Lab space is still perceptually uniform enough
/// for correct boundary disambiguation.
pub fn exact_nearest(r: f32, g: f32, b: f32, palette: &[Lab]) -> [u8; 3] {
    let lab: Lab = Srgb::new(r, g, b).into_color();
    let nearest = palette
        .iter()
        .copied()
        .min_by(|x, y| {
            lab_sq_dist(lab, *x)
                .partial_cmp(&lab_sq_dist(lab, *y))
                .unwrap_or(std::cmp::Ordering::Equal)
        })
        .unwrap();
    let out: Srgb<f32> = nearest.into_color();
    [
        (out.red   * 255.0).round().clamp(0.0, 255.0) as u8,
        (out.green * 255.0).round().clamp(0.0, 255.0) as u8,
        (out.blue  * 255.0).round().clamp(0.0, 255.0) as u8,
    ]
}

#[inline]
fn lab_sq_dist(a: Lab, b: Lab) -> f32 {
    let dl = a.l - b.l;
    let da = a.a - b.a;
    let db = a.b - b.b;
    dl * dl + da * da + db * db
}

#[cfg(test)]
mod tests {
    use super::*;

    fn red_green_palette() -> Vec<Lab> {
        vec![
            Srgb::new(1.0f32, 0.0, 0.0).into_color(),
            Srgb::new(0.0f32, 1.0, 0.0).into_color(),
        ]
    }

    #[test]
    fn pure_red_maps_to_red() {
        let lut = PaletteLut::build(&red_green_palette());
        let [r, g, b] = lut.lookup(255, 0, 0);
        assert!(r > 200 && g < 50 && b < 50, "expected red, got ({r},{g},{b})");
    }

    #[test]
    fn pure_green_maps_to_green() {
        let lut = PaletteLut::build(&red_green_palette());
        let [r, g, b] = lut.lookup(0, 255, 0);
        assert!(g > 200 && r < 50 && b < 50, "expected green, got ({r},{g},{b})");
    }

    #[test]
    fn boundary_pixel_matches_brute_force() {
        let palette = red_green_palette();
        let lut = PaletteLut::build(&palette);
        // A pixel near the red/green boundary — equal R and G components
        let (r, g, b) = (128u8, 128u8, 0u8);
        let lut_result = lut.lookup(r, g, b);
        let exact = exact_nearest(r as f32 / 255.0, g as f32 / 255.0, b as f32 / 255.0, &palette);
        assert_eq!(lut_result, exact, "boundary pixel mismatch: LUT={lut_result:?} exact={exact:?}");
    }
}
