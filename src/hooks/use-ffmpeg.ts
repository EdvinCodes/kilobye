import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { type WatermarkSettings } from "@/store/file-store";

// Tipos definidos para UI y lógica
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
    duration?: number,
    watermarkSettings?: WatermarkSettings,
  ): Promise<Blob> => {
    if (!ffmpegRef.current) ffmpegRef.current = new FFmpeg();
    const ffmpeg = ffmpegRef.current;
    if (!loaded) await load();

    const inputName = "input" + getExt(file.name);

    // Determinar extensión de salida
    let outputExt = ".mp4";
    if (settings.format === "gif") outputExt = ".gif";
    if (settings.format === "mp3") outputExt = ".mp3";
    const outputName = "output" + outputExt;

    // Escribir archivo principal en memoria WASM
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // --- CASO ESPECIAL: MP3 (Solo audio) ---
    if (settings.format === "mp3") {
      const command = [
        "-i",
        inputName,
        "-vn", // Eliminar video
        "-acodec",
        "libmp3lame",
        "-q:a",
        "2", // Alta calidad VBR (~190kbps)
        outputName,
      ];

      ffmpeg.on("progress", ({ progress }) => {
        onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
      });

      await ffmpeg.exec(command);
      const data = await ffmpeg.readFile(outputName);
      await cleanup(ffmpeg, inputName, outputName);
      return new Blob([data as unknown as BlobPart], { type: "audio/mpeg" });
    }

    // --- LOGICA DE VIDEO (MP4 / GIF) ---

    // 1. Preparar Watermark si existe
    let hasWatermark = false;
    if (watermarkSettings?.isEnabled && watermarkSettings.file) {
      hasWatermark = true;
      await ffmpeg.writeFile(
        "watermark.png",
        await fetchFile(watermarkSettings.file),
      );
    }

    // 2. Construir Filter Complex (Cadena de filtros)
    // Esto es necesario para combinar Escala + Watermark en el mismo paso
    let filterComplex = "";

    if (hasWatermark && watermarkSettings) {
      // Calcular posición del overlay
      const m = watermarkSettings.margin;
      let x = "",
        y = "";

      switch (watermarkSettings.position) {
        case "top-left":
          x = `${m}`;
          y = `${m}`;
          break;
        case "top-right":
          x = `main_w-overlay_w-${m}`;
          y = `${m}`;
          break;
        case "bottom-left":
          x = `${m}`;
          y = `main_h-overlay_h-${m}`;
          break;
        case "bottom-right":
          x = `main_w-overlay_w-${m}`;
          y = `main_h-overlay_h-${m}`;
          break;
        case "center":
          x = `(main_w-overlay_w)/2`;
          y = `(main_h-overlay_h)/2`;
          break;
      }

      // CADENA DE FILTROS:
      // [0:v] -> Video Input
      // [1:v] -> Logo Input
      // 1. Si hay cambio de resolución, escalamos el video [0:v] primero -> [bg]
      // 2. Escalamos el logo [1:v] relativo al video -> [fg]
      // 3. Superponemos [bg][fg] -> Output

      const scaleFilter =
        settings.resolution !== "original"
          ? `scale=-2:${settings.resolution}`
          : "null";
      const logoScale = watermarkSettings.scale; // 0.1 a 0.5

      // Explicación del grafo:
      // [0:v]scale...[bg] : Escala el video base y lo llama 'bg'
      // [1:v]scale...[fg] : Escala el logo relativo al input (iw*scale) y lo llama 'fg'
      // [bg][fg]overlay...: Pone fg sobre bg
      filterComplex = `[0:v]${scaleFilter}[bg];[1:v]scale=iw*${logoScale}:-1[fg];[bg][fg]overlay=${x}:${y}`;
    } else if (settings.resolution !== "original") {
      // Si no hay watermark, solo escalamos simple
      filterComplex = `scale=-2:${settings.resolution}`;
    }

    // 3. Construir Comando Principal
    const command: string[] = [];

    // Inputs
    command.push("-i", inputName);
    if (hasWatermark) command.push("-i", "watermark.png");

    // Aplicar filtros
    if (filterComplex) {
      command.push("-filter_complex", filterComplex);
    }

    // FPS
    if (settings.fps !== "original") {
      command.push("-r", settings.fps);
    }

    // Audio
    if (settings.removeAudio || settings.format === "gif") {
      command.push("-an"); // Sin audio
    } else {
      command.push("-c:a", "aac", "-b:a", "128k");
    }

    // --- CALCULO DE BITRATE (Social Presets) ---
    if (
      settings.targetSize &&
      duration &&
      duration > 0 &&
      settings.format !== "gif"
    ) {
      let targetMB = 0;
      if (settings.targetSize === "discord-8mb") targetMB = 7.5;
      if (settings.targetSize === "email-25mb") targetMB = 24;
      if (settings.targetSize === "whatsapp-16mb") targetMB = 15;
      if (settings.targetSize === "custom-10mb") targetMB = 10;

      // (MB * 8192) / seconds = kbits
      const audioBitrate = settings.removeAudio ? 0 : 128;
      let videoBitrate =
        Math.floor((targetMB * 8192) / duration) - audioBitrate;
      if (videoBitrate < 100) videoBitrate = 100;

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
        "ultrafast",
      );
    } else {
      // Modo Calidad (CRF)
      if (settings.format !== "gif") {
        let crf = "28";
        if (settings.quality === "high") crf = "23";
        if (settings.quality === "low") crf = "32";

        command.push("-c:v", "libx264", "-crf", crf, "-preset", "ultrafast");
      }
    }

    // GIF específico (paleta optimizada básica para velocidad)
    if (settings.format === "gif") {
      // Para GIF usamos split+palettegen para mejor calidad, pero es lento.
      // Por velocidad en browser, usaremos dither simple si el filtro complejo ya existe.
      // Si no hay filtro complejo, podemos añadir fps y escala aquí.
    }

    command.push(outputName);

    // --- EJECUCIÓN ---
    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
    });

    await ffmpeg.exec(command);

    const data = await ffmpeg.readFile(outputName);

    // Limpieza
    await cleanup(ffmpeg, inputName, outputName);
    if (hasWatermark) {
      try {
        await ffmpeg.deleteFile("watermark.png");
      } catch {}
    }

    let mime = "video/mp4";
    if (settings.format === "gif") mime = "image/gif";

    return new Blob([data as unknown as BlobPart], { type: mime });
  };

  return { loaded, isLoading, load, compressVideo };
}

// Utilidades internas
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
