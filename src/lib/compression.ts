import imageCompression from "browser-image-compression";
import { type WatermarkSettings } from "@/store/file-store";

export type OutputFormat =
  | "original"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif";

/**
 * Dibuja el watermark en el contexto del canvas
 */
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  watermarkImg: HTMLImageElement,
  settings: WatermarkSettings,
) {
  const { scale, opacity, position, margin } = settings;

  // 1. Calcular tamaño del logo (relativo al ancho de la imagen base)
  // scale es un valor entre 0.1 y 0.5 (10% a 50%)
  const logoWidth = canvasWidth * scale;
  const logoHeight = logoWidth * (watermarkImg.height / watermarkImg.width);

  // 2. Calcular posición (X, Y)
  let x = 0;
  let y = 0;

  // Ajustamos el margen relativo a la resolución (para que se vea igual en 4k que en 720p)
  // Usamos 1920px como base de referencia.
  const relativeMargin = margin * (canvasWidth / 1920);

  switch (position) {
    case "top-left":
      x = relativeMargin;
      y = relativeMargin;
      break;
    case "top-right":
      x = canvasWidth - logoWidth - relativeMargin;
      y = relativeMargin;
      break;
    case "bottom-left":
      x = relativeMargin;
      y = canvasHeight - logoHeight - relativeMargin;
      break;
    case "bottom-right":
      x = canvasWidth - logoWidth - relativeMargin;
      y = canvasHeight - logoHeight - relativeMargin;
      break;
    case "center":
      x = (canvasWidth - logoWidth) / 2;
      y = (canvasHeight - logoHeight) / 2;
      break;
  }

  // 3. Dibujar
  ctx.globalAlpha = opacity;
  ctx.drawImage(watermarkImg, x, y, logoWidth, logoHeight);
  ctx.globalAlpha = 1.0; // Reset opacidad
}

/**
 * Aplica el watermark a un archivo y devuelve un nuevo Blob
 */
async function applyWatermark(
  file: File,
  settings: WatermarkSettings,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    const logo = new Image();
    if (settings.preview) logo.src = settings.preview;

    const process = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("No se pudo crear contexto 2D"));
      }

      // 1. Dibujar imagen base
      ctx.drawImage(img, 0, 0);

      // 2. Dibujar Watermark si existe
      if (settings.preview) {
        drawWatermark(ctx, canvas.width, canvas.height, logo, settings);
      }

      // 3. Exportar
      // Intentamos mantener el tipo original, o fallback a PNG para máxima calidad antes de comprimir
      const exportType =
        file.type === "image/jpeg" ? "image/jpeg" : "image/png";

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            // Devolvemos un File nuevo con el mismo nombre
            const newFile = new File([blob], file.name, {
              type: exportType,
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else reject(new Error("Fallo al exportar watermark"));
        },
        exportType,
        1.0,
      );
    };

    img.onload = () => {
      if (settings.preview && !logo.complete) {
        logo.onload = () => process();
        logo.onerror = () => process(); // Si falla el logo, procesamos sin él
      } else {
        process();
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error cargando imagen base"));
    };

    img.src = url;
  });
}

/**
 * Conversión forzosa de formato (Canvas)
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

      // Calidad inteligente según formato
      let quality = 0.8;
      if (targetFormat === "image/avif") quality = 0.5; // AVIF es muy eficiente
      if (targetFormat === "image/webp") quality = 0.75;
      if (targetFormat === "image/jpeg") quality = 0.75;

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

/**
 * FUNCIÓN PRINCIPAL DE COMPRESIÓN
 */
export async function compressImage(
  file: File,
  format: OutputFormat = "original",
  maxWidth: number = 0,
  watermarkSettings?: WatermarkSettings, // <--- OPCIONAL: Configuración de marca de agua
): Promise<Blob> {
  // 1. PROTECCIÓN DE GIFS
  // Si es un GIF, lo devolvemos intacto para no romper la animación.
  if (file.type === "image/gif") {
    // Si el usuario quería cambiar formato, mala suerte, priorizamos la animación.
    // (En el futuro esto se podría hacer con FFmpeg en modo video).
    return file;
  }

  // 2. APLICAR WATERMARK (Pre-proceso)
  let fileToProcess = file;
  if (watermarkSettings?.isEnabled && watermarkSettings.file) {
    try {
      fileToProcess = await applyWatermark(file, watermarkSettings);
    } catch (e) {
      console.error("Error aplicando watermark, continuando con original", e);
    }
  }

  // 3. CONFIGURAR COMPRESIÓN
  const targetMaxWidth = maxWidth === 0 ? 1920 : maxWidth;
  const targetMaxSizeMB = maxWidth === 0 ? 1 : 50;

  // Browser-image-compression no soporta AVIF nativo en input 'fileType' a veces,
  // así que usamos WebP como intermedio si el destino es AVIF.
  let fileTypeForLibrary: string | undefined = undefined;
  if (format === "image/avif") fileTypeForLibrary = "image/webp";
  else if (format !== "original") fileTypeForLibrary = format;

  const options = {
    maxSizeMB: targetMaxSizeMB,
    maxWidthOrHeight: targetMaxWidth,
    useWebWorker: true,
    initialQuality: 0.75,
    fileType: fileTypeForLibrary,
  };

  try {
    // 4. COMPRIMIR
    let compressedBlob: Blob = await imageCompression(fileToProcess, options);

    // 5. CONVERSIÓN FINAL (Si la librería no lo hizo o es AVIF)
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
