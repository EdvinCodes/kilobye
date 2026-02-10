import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Definimos las opciones disponibles
export type VideoSettings = {
  resolution: "original" | "1080" | "720" | "480";
  fps: "original" | "60" | "30";
  quality: "high" | "medium" | "low"; // High=CRF 23, Medium=CRF 28, Low=CRF 32
};

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const load = async () => {
    if (loaded) return;
    setIsLoading(true);

    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }
    
    const ffmpeg = ffmpegRef.current;
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      setLoaded(true);
    } catch (error) {
      console.error("Fallo al cargar FFmpeg WASM:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const compressVideo = async (
    file: File, 
    settings: VideoSettings, // <--- AHORA RECIBIMOS CONFIGURACIÓN
    onProgress: (progress: number) => void
  ): Promise<Blob> => {
    if (!ffmpegRef.current) ffmpegRef.current = new FFmpeg();
    const ffmpeg = ffmpegRef.current;
    if (!loaded) await load();

    const inputName = "input" + getExt(file.name);
    const outputName = "output.mp4";

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
    });

    // --- CONSTRUCCIÓN DINÁMICA DEL COMANDO ---
    const command = ["-i", inputName];

    // 1. Resolución
    if (settings.resolution !== "original") {
      // scale=-2:720 mantiene el aspect ratio y asegura dimensiones pares
      command.push("-vf", `scale=-2:${settings.resolution}`);
    }

    // 2. FPS
    if (settings.fps !== "original") {
      command.push("-r", settings.fps);
    }

    // 3. Calidad (CRF) - Menor número = Mayor calidad / Mayor peso
    let crf = "28"; // Default Medium
    if (settings.quality === "high") crf = "23"; // Casi original
    if (settings.quality === "low") crf = "32";  // Muy comprimido

    // 4. Codec y Preset
    command.push(
      "-c:v", "libx264",
      "-crf", crf,
      "-preset", "ultrafast", // Siempre rápido porque es navegador
      "-c:a", "aac",
      "-b:a", "128k",
      outputName
    );

    await ffmpeg.exec(command);

    const data = await ffmpeg.readFile(outputName);
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new Blob([data as unknown as BlobPart], { type: "video/mp4" });
  };

  return { loaded, isLoading, load, compressVideo };
}

function getExt(filename: string) {
  const ext = filename.split(".").pop();
  return ext ? "." + ext : ".mp4";
}