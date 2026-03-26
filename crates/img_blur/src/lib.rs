/// Gaussian blur on RGBA pixels via fastblur.
/// `sigma` is the Gaussian standard deviation (blur strength); <= 0 returns a clone.
/// fastblur expects RGB, so alpha is stripped before blurring and restored after.
pub fn gaussian_blur(pixels: &[u8], width: u32, height: u32, sigma: f32) -> Vec<u8> {
    if sigma <= 0.0 {
        return pixels.to_vec();
    }

    let n = (width * height) as usize;
    let mut rgb: Vec<[u8; 3]> = Vec::with_capacity(n);
    let mut alphas: Vec<u8> = Vec::with_capacity(n);

    for i in 0..n {
        let b = i * 4;
        rgb.push([pixels[b], pixels[b + 1], pixels[b + 2]]);
        alphas.push(pixels[b + 3]);
    }

    fastblur::gaussian_blur(&mut rgb, width as usize, height as usize, sigma);

    let mut out = vec![0u8; pixels.len()];
    for i in 0..n {
        out[i * 4]     = rgb[i][0];
        out[i * 4 + 1] = rgb[i][1];
        out[i * 4 + 2] = rgb[i][2];
        out[i * 4 + 3] = alphas[i];
    }
    out
}
