import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// TIPOS AMPLIADOS
export type TargetSizePreset =
  | "discord-8mb"
  | "email-25mb"
  | "whatsapp-16mb"
  | "custom-10mb"
  | null;

export type VideoSettings = {
  resolution: "original" | "1080" | "720" | "480";
  fps: "original" | "60" | "30";
  quality: "high" | "medium" | "low";
  // --- NUEVOS ---
  targetSize: TargetSizePreset;
  removeAudio: boolean;
  format: "mp4" | "gif" | "mp3";
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
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
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
    settings: VideoSettings,
    onProgress: (progress: number) => void,
    duration?: number, // <--- AHORA RECIBIMOS DURACIÓN
  ): Promise<Blob> => {
    if (!ffmpegRef.current) ffmpegRef.current = new FFmpeg();
    const ffmpeg = ffmpegRef.current;
    if (!loaded) await load();

    const inputName = "input" + getExt(file.name);
    // Si el usuario pide GIF o MP3, cambiamos la extensión de salida
    let outputExt = ".mp4";
    if (settings.format === "gif") outputExt = ".gif";
    if (settings.format === "mp3") outputExt = ".mp3";

    const outputName = "output" + outputExt;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
    });

    // --- CONSTRUCCIÓN DEL COMANDO ---
    const command = ["-i", inputName];

    // 0. FORMATO ESPECIAL (GIF/MP3)
    if (settings.format === "mp3") {
      // Solo audio
      command.push("-vn", "-acodec", "libmp3lame", "-q:a", "2", outputName);
      await ffmpeg.exec(command);
      const data = await ffmpeg.readFile(outputName);
      await cleanup(ffmpeg, inputName, outputName);
      return new Blob([data as unknown as BlobPart], { type: "audio/mpeg" });
    }

    // 1. RESOLUCIÓN (Solo si no es MP3)
    let filters = "";
    if (settings.resolution !== "original") {
      filters += `scale=-2:${settings.resolution}`;
    }

    // 2. FPS
    if (settings.fps !== "original") {
      command.push("-r", settings.fps);
    }

    // 3. AUDIO STRIPPING
    if (settings.removeAudio) {
      command.push("-an");
    } else {
      command.push("-c:a", "aac", "-b:a", "128k");
    }

    // --- LÓGICA DE COMPRESIÓN (CRF vs TARGET SIZE) ---

    // Si hay un Target Size Y tenemos duración, usamos Bitrate Calculation
    if (settings.targetSize && duration && duration > 0) {
      let targetMB = 0;
      if (settings.targetSize === "discord-8mb") targetMB = 7.5; // Margen de seguridad
      if (settings.targetSize === "email-25mb") targetMB = 24;
      if (settings.targetSize === "whatsapp-16mb") targetMB = 15;
      if (settings.targetSize === "custom-10mb") targetMB = 10;

      // Fórmula: (TargetMB * 8192) / Duration_Seconds = Bitrate in kbps
      // Restamos 128kbps para el audio si no está muteado
      const audioBitrate = settings.removeAudio ? 0 : 128;
      let videoBitrate =
        Math.floor((targetMB * 8192) / duration) - audioBitrate;

      if (videoBitrate < 100) videoBitrate = 100; // Mínimo de seguridad

      console.log(
        `🎯 Target: ${targetMB}MB | Duration: ${duration}s | Calc Bitrate: ${videoBitrate}k`,
      );

      command.push(
        "-c:v",
        "libx264",
        "-b:v",
        `${videoBitrate}k`,
        "-maxrate",
        `${videoBitrate}k`,
        "-bufsize",
        `${videoBitrate * 2}k`,
        "-preset",
        "ultrafast", // Pass 1 (rápido)
      );
    } else {
      // --- MODO CALIDAD (CRF) ---
      let crf = "28";
      if (settings.quality === "high") crf = "23";
      if (settings.quality === "low") crf = "32";

      command.push("-c:v", "libx264", "-crf", crf, "-preset", "ultrafast");
    }

    // Aplicar filtros si existen
    if (filters) {
      command.push("-vf", filters);
    }

    // Output final
    command.push(outputName);

    await ffmpeg.exec(command);

    const data = await ffmpeg.readFile(outputName);

    await cleanup(ffmpeg, inputName, outputName);

    let mime = "video/mp4";
    if (settings.format === "gif") mime = "image/gif";

    return new Blob([data as unknown as BlobPart], { type: mime });
  };

  return { loaded, isLoading, load, compressVideo };
}

async function cleanup(ffmpeg: FFmpeg, input: string, output: string) {
  try {
    await ffmpeg.deleteFile(input);
  } catch {}
  try {
    await ffmpeg.deleteFile(output);
  } catch {}
}

function getExt(filename: string) {
  const ext = filename.split(".").pop();
  return ext ? "." + ext : ".mp4";
}
