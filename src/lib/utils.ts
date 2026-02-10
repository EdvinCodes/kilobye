import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/avif":
      return ".avif";
    case "image/gif":
      return ".gif"; // <--- NUEVO
    case "video/mp4":
      return ".mp4"; // <--- NUEVO
    case "video/quicktime":
      return ".mov"; // <--- NUEVO
    case "video/webm":
      return ".webm"; // <--- NUEVO
    case "audio/mpeg":
      return ".mp3"; // <--- NUEVO
    default:
      return "";
  }
}

export function getCorrectFileName(originalName: string, blob: Blob): string {
  // 1. Intentamos obtener la extensión del tipo MIME del resultado
  const newExtension = getExtensionFromMimeType(blob.type);

  // 2. Quitamos la extensión original del nombre
  const nameParts = originalName.split(".");
  if (nameParts.length > 1) nameParts.pop();
  const baseName = nameParts.join(".");

  // 3. Si tenemos extensión nueva, la usamos. Si no, devolvemos el original.
  if (newExtension) {
    return baseName + newExtension;
  }

  return originalName;
}
