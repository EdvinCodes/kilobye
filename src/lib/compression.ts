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
            resolve(blob);
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
): Promise<Blob> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: format === "original" ? undefined : format,
  };

  try {
    // CORRECCIÓN AQUÍ:
    // Tipamos la variable como 'Blob' (el tipo genérico).
    // Un 'File' es un 'Blob', así que acepta ambos sin quejarse.
    let compressedBlob: Blob = await imageCompression(file, options);

    // Si pedimos un formato específico y la librería nos ignoró (ej: pidió webp y devolvió png)
    if (format !== "original" && compressedBlob.type !== format) {
      console.log(
        `Forzando conversión de ${compressedBlob.type} a ${format}...`,
      );

      // Ahora sí podemos asignar el resultado del Canvas (Blob) a esta variable
      compressedBlob = await forceFormatConversion(compressedBlob, format);
    }

    return compressedBlob;
  } catch (error) {
    console.error("Error en compresión:", error);
    throw error;
  }
}
