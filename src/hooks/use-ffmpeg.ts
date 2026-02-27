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

    // ✅ FIX #3 — Siempre crear instancia fresca en load()
    // Si la instancia anterior quedó en estado roto (load() falló a mitad),
    // reutilizarla causaría comportamiento indefinido en ffmpeg.load()
    ffmpegRef.current = new FFmpeg();

    const ffmpeg = ffmpegRef.current;

    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd";

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
        workerURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.worker.js`,
          "text/javascript",
        ),
      });

      setLoaded(true);
      console.log("🚀 KiloBye Engine: Multi-Threaded Core Loaded");
    } catch (error) {
      // ✅ FIX #3 — Si falla, limpiar la ref para que el próximo intento
      // entre en el bloque de creación de instancia fresca
      ffmpegRef.current = null;
      console.error(
        "Fallo al cargar FFmpeg MT. Revisa los headers COOP/COEP.",
        error,
      );
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
    // ✅ FIX #3 — Eliminar el new FFmpeg() de aquí, load() lo gestiona
    if (!loaded) await load();
    const ffmpeg = ffmpegRef.current!;

    const inputName = "input" + getExt(file.name);

    let outputExt = ".mp4";
    if (settings.format === "gif") outputExt = ".gif";
    if (settings.format === "mp3") outputExt = ".mp3";
    const outputName = "output" + outputExt;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // --- CASO ESPECIAL: MP3 (Solo audio) ---
    if (settings.format === "mp3") {
      const command = [
        "-i",
        inputName,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-q:a",
        "2",
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

    // --- LÓGICA DE VIDEO (MP4 / GIF) ---

    // 1. Preparar Watermark si existe
    let hasWatermark = false;
    if (watermarkSettings?.isEnabled && watermarkSettings.file) {
      hasWatermark = true;
      await ffmpeg.writeFile(
        "watermark.png",
        await fetchFile(watermarkSettings.file),
      );
    }

    // 2. Construir Filter Complex
    let filterComplex = "";

    if (hasWatermark && watermarkSettings) {
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

      const logoScale = watermarkSettings.scale;
      let videoStream = "[0:v]";
      let scaleFilter = "";

      if (settings.resolution !== "original") {
        scaleFilter = `${videoStream}scale=-2:${settings.resolution}[bg];`;
        videoStream = "[bg]";
      }

      filterComplex = `${scaleFilter}[1:v]scale2ref=${videoStream}*${logoScale}:-1[wm][scaled];[scaled][wm]overlay=${x}:${y}[out]`;
    } else if (settings.resolution !== "original") {
      filterComplex = `[0:v]scale=-2:${settings.resolution}[out]`;
    }

    // ✅ FIX #2 — GIF siempre necesita palettegen+paletteuse
    // Sin esto: paleta genérica de 256 colores → banding o crash
    if (settings.format === "gif") {
      if (filterComplex) {
        filterComplex = `${filterComplex};[out]split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer[gifout]`;
      } else {
        filterComplex = `[0:v]split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer[gifout]`;
      }
    }

    // 3. Construir Comando
    const command: string[] = [];
    command.push("-i", inputName);
    if (hasWatermark) command.push("-i", "watermark.png");

    if (filterComplex) {
      command.push("-filter_complex", filterComplex);
      if (settings.format === "gif") {
        command.push("-map", "[gifout]");
      } else if (hasWatermark || settings.resolution !== "original") {
        command.push("-map", "[out]");
      }
    }

    if (settings.fps !== "original") {
      command.push("-r", settings.fps);
    }

    if (settings.removeAudio || settings.format === "gif") {
      command.push("-an");
    } else {
      command.push("-c:a", "aac", "-b:a", "128k");
    }

    // --- CÁLCULO DE BITRATE (Social Presets) ---
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
        "-threads",
        "0",
      );
    } else if (settings.format !== "gif") {
      // ✅ FIX #2 — Aviso si targetSize fue ignorado por duration=0
      if (settings.targetSize && (!duration || duration <= 0)) {
        console.warn(
          "[KiloBye] Target size ignorado: duración desconocida. Usando CRF por defecto.",
        );
      }

      let crf = "28";
      if (settings.quality === "high") crf = "23";
      if (settings.quality === "low") crf = "32";
      command.push(
        "-c:v",
        "libx264",
        "-crf",
        crf,
        "-preset",
        "ultrafast",
        "-threads",
        "0",
      );
    }

    command.push(outputName);

    // --- EJECUCIÓN ---
    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
    });

    await ffmpeg.exec(command);
    const data = await ffmpeg.readFile(outputName);

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

// Utilidades
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
  return ext ? "." + ext : "";
}
