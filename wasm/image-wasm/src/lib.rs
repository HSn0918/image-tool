use std::io::Cursor;

use image::{imageops::FilterType, ImageFormat, ImageReader};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ResizeResult {
    data: Vec<u8>,
    width: u32,
    height: u32,
    original_width: u32,
    original_height: u32,
    resized: bool,
}

#[wasm_bindgen]
impl ResizeResult {
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.height
    }

    #[wasm_bindgen(getter, js_name = originalWidth)]
    pub fn original_width(&self) -> u32 {
        self.original_width
    }

    #[wasm_bindgen(getter, js_name = originalHeight)]
    pub fn original_height(&self) -> u32 {
        self.original_height
    }

    #[wasm_bindgen(getter)]
    pub fn resized(&self) -> bool {
        self.resized
    }

    #[wasm_bindgen]
    pub fn data(&self) -> js_sys::Uint8Array {
        js_sys::Uint8Array::from(self.data.as_slice())
    }
}

fn js_error(message: impl AsRef<str>) -> JsValue {
    JsValue::from_str(message.as_ref())
}

#[wasm_bindgen]
pub fn resize_image(bytes: &[u8], long_edge: u32) -> Result<ResizeResult, JsValue> {
    console_error_panic_hook::set_once();
    if bytes.is_empty() {
        return Err(js_error("Empty buffer"));
    }
    let max_edge = long_edge.max(1);
    let reader = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|_| js_error("Unsupported image data"))?;
    let image = reader
        .decode()
        .map_err(|err| js_error(format!("Decode failed: {err}")))?;
    let orig_width = image.width();
    let orig_height = image.height();
    if orig_width == 0 || orig_height == 0 {
        return Err(js_error("Image has zero dimension"));
    }
    let max_source = orig_width.max(orig_height);
    let scale = max_edge as f64 / max_source as f64;
    let width = (orig_width as f64 * scale)
        .round()
        .clamp(1.0, u32::MAX as f64) as u32;
    let height = (orig_height as f64 * scale)
        .round()
        .clamp(1.0, u32::MAX as f64) as u32;
    let resized = width != orig_width || height != orig_height;
    let final_img = if resized {
        image.resize(width, height, FilterType::Lanczos3)
    } else {
        image
    };
    let mut cursor = Cursor::new(Vec::new());
    final_img
        .write_to(&mut cursor, ImageFormat::Png)
        .map_err(|err| js_error(format!("Encode failed: {err}")))?;
    let png_bytes = cursor.into_inner();
    Ok(ResizeResult {
        data: png_bytes,
        width,
        height,
        original_width: orig_width,
        original_height: orig_height,
        resized,
    })
}
