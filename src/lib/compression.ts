import imageCompression from "browser-image-compression";

export type OutputFormat =
  | "original"
  | "image/jpeg"
  | "image/png"
  | "image/webp";

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

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            const forcedBlob = new Blob([blob], { type: targetFormat });
            resolve(forcedBlob);
          } else {
            reject(new Error("Falló la conversión de formato"));
          }
        },
        targetFormat,
        0.9,
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
  maxWidth: number = 0, // 0 significa "Automático / Web Optimization"
): Promise<Blob> {
  // LOGICA HÍBRIDA:
  let targetMaxWidth: number;
  let targetMaxSizeMB: number;

  if (maxWidth === 0) {
    // MODO AUTOMÁTICO (El que quieres por defecto)
    // Reducimos a estándar web (Full HD) y forzamos compresión agresiva (1MB)
    targetMaxWidth = 1920;
    targetMaxSizeMB = 1;
  } else {
    // MODO MANUAL (El usuario ha puesto un número)
    // Respetamos su tamaño exacto y subimos el límite de peso para que quepa
    targetMaxWidth = maxWidth;
    targetMaxSizeMB = 50;
  }

  const options = {
    maxSizeMB: targetMaxSizeMB,
    maxWidthOrHeight: targetMaxWidth,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: format === "original" ? undefined : format,
  };

  try {
    let compressedBlob: Blob = await imageCompression(file, options);

    // Lógica de formatos
    if (format !== "original" && compressedBlob.type !== format) {
      console.log(
        `Forzando conversión de ${compressedBlob.type} a ${format}...`,
      );
      compressedBlob = await forceFormatConversion(compressedBlob, format);
    }

    return compressedBlob;
  } catch (error) {
    console.error("Error en compresión:", error);
    throw error;
  }
}
