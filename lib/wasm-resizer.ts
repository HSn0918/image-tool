type ImageWasmModule = typeof import("@/wasm/image-wasm/pkg/image_wasm");

let wasmModulePromise: Promise<ImageWasmModule> | null = null;

async function loadWasmModule(): Promise<ImageWasmModule> {
  if (wasmModulePromise) {
    return wasmModulePromise;
  }
  if (typeof window === "undefined") {
    throw new Error("WebAssembly is only available in the browser runtime.");
  }
  wasmModulePromise = import("@/wasm/image-wasm/pkg/image_wasm")
    .then(async (mod) => {
      await mod.default();
      return mod;
    })
    .catch((error) => {
      wasmModulePromise = null;
      throw error;
    });
  return wasmModulePromise;
}

export interface WasmResizePayload {
  data: Uint8Array;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  resized: boolean;
}

export async function resizeImageWithWasm(
  bytes: Uint8Array,
  longEdge: number,
): Promise<WasmResizePayload> {
  const wasm = await loadWasmModule();
  const result = wasm.resize_image(bytes, longEdge);
  const payload: WasmResizePayload = {
    data: result.data(),
    width: result.width,
    height: result.height,
    originalWidth: result.originalWidth,
    originalHeight: result.originalHeight,
    resized: result.resized,
  };
  if (typeof result.free === "function") {
    result.free();
  }
  return payload;
}
