import JSZip from "jszip";
import { MediaFile } from "@/store/file-store"; // <--- CAMBIO AQUÍ (Antes era ImageFile)
import { getCorrectFileName } from "./utils";

/**
 * Descarga un único archivo Blob creando un link temporal
 */
export function downloadBlob(blob: Blob, filename: string) {
  // Crear URL temporal
  const url = URL.createObjectURL(blob);

  // Crear elemento <a> invisible
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Click programático
  document.body.appendChild(link);
  link.click();

  // Limpieza (Vital para no llenar la memoria RAM)
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera un ZIP con todos los archivos comprimidos y lo descarga
 */
export async function downloadAllAsZip(files: MediaFile[]) { // <--- CAMBIO AQUÍ EL TIPO
  const zip = new JSZip();
  const folder = zip.folder("kilobye-optimized");

  let count = 0;
  files.forEach((media) => {
    if (media.status === "done" && media.compressedFile) {
      
      // Lógica simple para nombre: Si es video y no tiene extensión mp4, se la ponemos
      // Si es imagen, usamos la lógica inteligente de utils
      let finalName = media.file.name;
      
      if (media.file.type.startsWith("video")) {
         const parts = media.file.name.split('.');
         // Si ya es .mp4 lo dejamos, si no, forzamos .mp4 (ya que FFmpeg saca mp4)
         if (parts[parts.length - 1] !== 'mp4') {
            parts.pop();
            finalName = parts.join('.') + ".mp4";
         }
      } else {
         finalName = getCorrectFileName(media.file.name, media.compressedFile);
      }

      folder?.file(finalName, media.compressedFile);
      count++;
    }
  });

  if (count === 0) return;

  const content = await zip.generateAsync({ type: "blob" });
  downloadBlob(content, `kilobye-pack-${Date.now()}.zip`);
}