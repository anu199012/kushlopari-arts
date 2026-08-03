/** Client-side image compression for admin uploads (web). */

export const MAX_ORIGINAL_BYTES = 12 * 1024 * 1024; // 12 MB hard limit before compress
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB after compress
export const MAX_DIMENSION = 1920;

export type CompressResult = {
  blob: Blob;
  fileName: string;
  originalBytes: number;
  compressedBytes: number;
};

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function compressErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Please compress the image and try again.";
}

/**
 * Compresses an image to JPEG (or keeps WebP if smaller) using canvas.
 * Throws a user-facing Error if the file is too large / not compressible enough.
 */
export async function compressImageForUpload(file: File): Promise<CompressResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, or WebP).");
  }

  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error(
      `Image is too large (${formatMb(file.size)}). Please compress it below ${formatMb(
        MAX_ORIGINAL_BYTES
      )} (JPG/WebP) and try again.`
    );
  }

  // Already small enough — still normalize to JPEG for consistency if under limit
  if (file.size <= MAX_UPLOAD_BYTES && file.type === "image/jpeg") {
    return {
      blob: file,
      fileName: ensureExt(file.name, "jpg"),
      originalBytes: file.size,
      compressedBytes: file.size,
    };
  }

  const bitmap = await loadImageBitmap(file);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_DIMENSION);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not process image. Please compress it and try again.");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    let quality = 0.82;
    let blob = await canvasToBlob(canvas, "image/jpeg", quality);
    while (blob.size > MAX_UPLOAD_BYTES && quality > 0.45) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }

    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `Could not compress enough (${formatMb(file.size)} → ${formatMb(
          blob.size
        )}). Please compress the image manually (aim under ${formatMb(
          MAX_UPLOAD_BYTES
        )}) and try again.`
      );
    }

    return {
      blob,
      fileName: ensureExt(file.name, "jpg"),
      originalBytes: file.size,
      compressedBytes: blob.size,
    };
  } finally {
    bitmap.close?.();
  }
}

function ensureExt(name: string, ext: string) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${ext}`;
}

function fitWithin(w: number, h: number, max: number) {
  const scale = Math.min(1, max / Math.max(w, h));
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error("Please compress the image and try again."));
        else resolve(b);
      },
      type,
      quality
    );
  });
}
