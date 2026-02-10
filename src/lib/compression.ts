import imageCompression from "browser-image-compression";

export type OutputFormat =
  | "original"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif";

/**
 * Función auxiliar para forzar el cambio de formato usando Canvas
 */
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

      // CALIBRACIÓN DE CALIDAD
      // AVIF al 50% (0.5) es visualmente excelente y muy ligero.
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
  let targetMaxWidth: number;
  let targetMaxSizeMB: number;

  // 1. Configurar límites
  if (maxWidth === 0) {
    targetMaxWidth = 1920;
    targetMaxSizeMB = 1;
  } else {
    targetMaxWidth = maxWidth;
    targetMaxSizeMB = 50;
  }

  // 2. Determinar el formato para la librería (FIXED LOGIC)
  // Si es AVIF, usamos WebP como intermedio.
  // Si es Original, pasamos undefined para que la librería respete el input.
  let fileTypeForLibrary: string | undefined = undefined;

  if (format === "image/avif") {
    fileTypeForLibrary = "image/webp";
  } else if (format !== "original") {
    fileTypeForLibrary = format;
  }
  // Si es "original", fileTypeForLibrary se queda en undefined

  const options = {
    maxSizeMB: targetMaxSizeMB,
    maxWidthOrHeight: targetMaxWidth,
    useWebWorker: true,
    initialQuality: 0.75,
    fileType: fileTypeForLibrary,
  };

  try {
    // 3. Compresión Base
    let compressedBlob: Blob = await imageCompression(file, options);

    // 4. Conversión Final (Si es necesaria)
    // Caso especial AVIF: Convertimos el WebP intermedio a AVIF
    if (format === "image/avif" && compressedBlob.type !== "image/avif") {
      compressedBlob = await forceFormatConversion(
        compressedBlob,
        "image/avif",
      );
    }
    // Caso otros formatos: Si la librería falló en el tipo (raro), forzamos
    else if (format !== "original" && compressedBlob.type !== format) {
      compressedBlob = await forceFormatConversion(compressedBlob, format);
    }

    return compressedBlob;
  } catch (error) {
    console.error("Error en compresión:", error);
    throw error;
  }
}
