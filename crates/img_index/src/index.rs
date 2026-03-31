use palette::Lab;
use serde::Deserialize;
use crate::lut::PaletteLut;

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
    let lut = PaletteLut::build(palette);
    let mut out = pixels.to_vec();
    for chunk in out.chunks_mut(4) {
        let [r, g, b] = lut.lookup(chunk[0], chunk[1], chunk[2]);
        chunk[0] = r;
        chunk[1] = g;
        chunk[2] = b;
        // chunk[3] alpha is preserved
    }
    out
}
