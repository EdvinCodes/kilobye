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
export async function downloadAllAsZip(files: MediaFile[]) {
  const zip = new JSZip();
  const folder = zip.folder("kilobye-optimized");

  let count = 0;
  const usedNames = new Set<string>(); // <--- NUEVO: Registro de nombres

  files.forEach((media) => {
    if (media.status === "done" && media.compressedFile) {
      let finalName = media.file.name;

      if (media.file.type.startsWith("video")) {
        const parts = media.file.name.split(".");
        if (parts[parts.length - 1] !== "mp4") {
          parts.pop();
          finalName = parts.join(".") + ".mp4";
        }
      } else {
        finalName = getCorrectFileName(media.file.name, media.compressedFile);
      }

      // --- NUEVO: LÓGICA ANTI-COLISIONES ---
      let uniqueName = finalName;
      let counter = 1;

      // Mientras el nombre ya exista en el ZIP, le sumamos un número
      while (usedNames.has(uniqueName)) {
        const nameParts = finalName.split(".");
        const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : "";
        const base = nameParts.join(".");
        uniqueName = `${base} (${counter})${ext}`;
        counter++;
      }

      usedNames.add(uniqueName); // Lo registramos como usado
      // -------------------------------------

      folder?.file(uniqueName, media.compressedFile);
      count++;
    }
  });

  if (count === 0) return;

  const content = await zip.generateAsync({ type: "blob" });
  downloadBlob(content, `kilobye-pack-${Date.now()}.zip`);
}
