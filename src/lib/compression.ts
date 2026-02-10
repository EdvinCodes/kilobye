import imageCompression from "browser-image-compression";

export type OutputFormat =
  | "original"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif";

async function forceFormatConversion(
  file: Blob,
  targetFormat: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo crear contexto 2D"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      let quality = 0.8;
      if (targetFormat === "image/avif") quality = 0.5;
      if (targetFormat === "image/webp") quality = 0.7;
      if (targetFormat === "image/jpeg") quality = 0.7;

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(
              new Error(`El navegador no soporta exportar a ${targetFormat}`),
            );
          }
        },
        targetFormat,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error al cargar imagen para conversión"));
    };

    img.src = url;
  });
}

export async function compressImage(
  file: File,
  format: OutputFormat = "original",
  maxWidth: number = 0,
): Promise<Blob> {
  // --- FIX GIF: PROTECCIÓN CONTRA ROTURA DE ANIMACIÓN ---
  // El Canvas mata los GIFs. Si el usuario sube un GIF en modo imagen,
  // lo devolvemos tal cual para no "estafarle" dándole un PNG estático.
  if (file.type === "image/gif") {
    console.warn(
      "GIF detectado en modo imagen. Se devuelve original para mantener animación.",
    );
    return file;
  }

  let targetMaxWidth: number;
  let targetMaxSizeMB: number;

  if (maxWidth === 0) {
    targetMaxWidth = 1920;
    targetMaxSizeMB = 1;
  } else {
    targetMaxWidth = maxWidth;
    targetMaxSizeMB = 50;
  }

  let fileTypeForLibrary: string | undefined = undefined;

  if (format === "image/avif") {
    fileTypeForLibrary = "image/webp";
  } else if (format !== "original") {
    fileTypeForLibrary = format;
  }

  const options = {
    maxSizeMB: targetMaxSizeMB,
    maxWidthOrHeight: targetMaxWidth,
    useWebWorker: true,
    initialQuality: 0.75,
    fileType: fileTypeForLibrary,
  };

  try {
    let compressedBlob: Blob = await imageCompression(file, options);

    if (format === "image/avif" && compressedBlob.type !== "image/avif") {
      compressedBlob = await forceFormatConversion(
        compressedBlob,
        "image/avif",
      );
    } else if (format !== "original" && compressedBlob.type !== format) {
      compressedBlob = await forceFormatConversion(compressedBlob, format);
    }

    return compressedBlob;
  } catch (error) {
    console.error("Error en compresión:", error);
    throw error;
  }
}
