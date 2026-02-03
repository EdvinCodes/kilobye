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
    default:
      return ""; // Si no lo conocemos, no tocamos nada
  }
}

export function getCorrectFileName(originalName: string, blob: Blob): string {
  const newExtension = getExtensionFromMimeType(blob.type);
  if (!newExtension) return originalName;

  const dotIndex = originalName.lastIndexOf(".");
  if (dotIndex === -1) return originalName + newExtension;

  // Quitamos la extensión vieja y pegamos la nueva
  return originalName.substring(0, dotIndex) + newExtension;
}
