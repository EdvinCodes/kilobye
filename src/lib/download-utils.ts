import JSZip from "jszip";
import { ImageFile } from "@/store/file-store";

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
 * Genera un ZIP con todas las imágenes comprimidas y lo descarga
 */
export async function downloadAllAsZip(files: ImageFile[]) {
  const zip = new JSZip();
  const folder = zip.folder("kilobye-optimized");

  // Añadir solo los archivos que están listos ("done")
  let count = 0;
  files.forEach((img) => {
    if (img.status === "done" && img.compressedFile) {
      // Usamos el nombre original pero aseguramos que sea único si hiciera falta
      // (JSZip maneja duplicados sobrescribiendo, pero aquí asumimos nombres distintos)
      folder?.file(img.file.name, img.compressedFile);
      count++;
    }
  });

  if (count === 0) return;

  // Generar el ZIP
  const content = await zip.generateAsync({ type: "blob" });
  
  // Descargar usando la función anterior
  downloadBlob(content, `kilobye-images-${Date.now()}.zip`);
}