export type CompressOptions = {
  maxDim?: number;
  quality?: number;
  mimeType?: string;
};

const DEFAULTS: Required<CompressOptions> = {
  maxDim: 1280,
  quality: 0.75,
  mimeType: "image/jpeg",
};

/**
 * Resizes and re-encodes an image file on the client before upload, so a
 * multi-MB camera photo is never held in memory (or sent over the network)
 * at full resolution — full-resolution decode is what throws "out of
 * memory" on low-RAM Android devices.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxDim, quality, mimeType } = { ...DEFAULTS, ...options };

  let width: number;
  let height: number;
  let drawable: CanvasImageSource;
  let cleanup = () => {};

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    drawable = bitmap;
    cleanup = () => bitmap.close();
  } else {
    const { img, url } = await loadImageElement(file);
    width = img.naturalWidth;
    height = img.naturalHeight;
    drawable = img;
    cleanup = () => URL.revokeObjectURL(url);
  }

  try {
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak didukung di perangkat ini");
    ctx.drawImage(drawable, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Gagal memproses gambar"))),
        mimeType,
        quality,
      );
    });

    const name = file.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".jpg";
    return new File([blob], name, { type: mimeType, lastModified: Date.now() });
  } finally {
    cleanup();
  }
}

function loadImageElement(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca gambar"));
    };
    img.src = url;
  });
}
