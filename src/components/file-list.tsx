"use client";

import { useState, useEffect } from "react";
import { useFileStore } from "@/store/file-store";
import { FileCard } from "./file-card";
import { WatermarkPanel } from "./watermark-panel"; // <--- NUEVO IMPORT
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Archive,
  Settings2,
  Cpu,
  Volume2,
  VolumeX,
  Target,
  Youtube,
  Trash2,
} from "lucide-react";
import { compressImage, type OutputFormat } from "@/lib/compression";
import { downloadAllAsZip } from "@/lib/download-utils";
import { triggerPixelConfetti } from "@/lib/confetti";
import { useRetroSound } from "@/hooks/use-retro-sound";
import {
  useFFmpeg,
  type VideoSettings,
  type TargetSizePreset,
} from "@/hooks/use-ffmpeg";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

export function FileList() {
  const { files, updateFile, mode, watermark, clearAllFiles } = useFileStore(); // <--- Extraemos watermark
  const [isProcessing, setIsProcessing] = useState(false);
  const { playSuccess, playClick, playDelete } = useRetroSound();

  const { compressVideo, load: loadFFmpeg, loaded: ffmpegLoaded } = useFFmpeg();

  // ESTADOS IMAGEN
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [maxWidth, setMaxWidth] = useState<number>(0);
  const [youtubePreset, setYoutubePreset] = useState(false);

  // ESTADOS VIDEO
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: "720",
    fps: "30",
    quality: "medium",
    targetSize: null,
    removeAudio: false,
    format: "mp4",
  });

  const isAllDone = files.length > 0 && files.every((f) => f.status === "done");
  const hasPending = files.some((f) => f.status !== "done");

  useEffect(() => {
    if (mode === "video" && !ffmpegLoaded) {
      loadFFmpeg();
    }
  }, [mode, ffmpegLoaded, loadFFmpeg]);

  const handleCompressAll = async () => {
    setIsProcessing(true);
    playClick();

    const pendingFiles = files.filter((f) => f.status !== "done");

    if (mode === "image") {
      // PROCESAMIENTO POR LOTES (Batches) para evitar congelar la UI
      const CONCURRENCY_LIMIT = 3;

      for (let i = 0; i < pendingFiles.length; i += CONCURRENCY_LIMIT) {
        const chunk = pendingFiles.slice(i, i + CONCURRENCY_LIMIT);

        await Promise.all(
          chunk.map(async (imageFile) => {
            try {
              updateFile(imageFile.id, { status: "compressing" });
              const compressedBlob = await compressImage(
                imageFile.file,
                outputFormat,
                youtubePreset ? 1920 : maxWidth,
                youtubePreset ? 1.9 : 0,
                watermark,
              );
              updateFile(imageFile.id, {
                status: "done",
                compressedFile: compressedBlob,
                compressedSize: compressedBlob.size,
              });
            } catch (error) {
              console.error("Error compressing image:", error);
              updateFile(imageFile.id, { status: "error" });
            }
          }),
        );
      }
    } else {
      // --- MODO VIDEO ---
      for (const videoFile of pendingFiles) {
        try {
          updateFile(videoFile.id, { status: "compressing", progress: 0 });

          const compressedBlob = await compressVideo(
            videoFile.file,
            videoSettings,
            (progress) => updateFile(videoFile.id, { progress }),
            videoFile.duration,
            watermark, // <--- Pasamos configuración de Watermark
          );

          updateFile(videoFile.id, {
            status: "done",
            compressedFile: compressedBlob,
            compressedSize: compressedBlob.size,
            progress: 100,
          });
        } catch (e) {
          console.error(e);
          updateFile(videoFile.id, { status: "error" });
        }
      }
    }

    playSuccess();
    triggerPixelConfetti();
    setIsProcessing(false);
  };

  const handleDownloadZip = () => {
    downloadAllAsZip(files);
  };

  if (files.length === 0) return null;

  const totalOriginal = files.reduce((acc, f) => acc + f.originalSize, 0);
  const totalCompressed = files.reduce(
    (acc, f) => acc + (f.compressedSize || f.originalSize),
    0,
  );
  const totalSaved = totalOriginal - totalCompressed;

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 space-y-8 pb-24 px-4">
      {/* --- DASHBOARD CONTROL PANEL --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col xl:flex-row items-end xl:items-center justify-between gap-6 p-6 rounded-2xl shadow-xl backdrop-blur-md",
          "border-2",
          mode === "image"
            ? "bg-card/40 border-primary/20 shadow-primary/5"
            : "bg-violet-950/10 border-violet-500/20 shadow-violet-500/5",
        )}
      >
        {/* IZQUIERDA: TITULO Y ESTADO */}
        <div className="flex flex-col gap-2 w-full xl:w-auto">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg border",
                mode === "image"
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-violet-500/10 border-violet-500/30 text-violet-400",
              )}
            >
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight retro-text flex items-center gap-2">
                OPERATION_CENTER
              </h2>
              {/* Añadimos flex-wrap al contenedor principal */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-muted-foreground mt-1">
                {/* Añadimos whitespace-nowrap para que no se rompa el texto */}
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  SYSTEM_ONLINE
                </span>

                <span className="hidden sm:inline text-muted-foreground/50">
                  |
                </span>

                {/* Añadimos whitespace-nowrap aquí también */}
                <span className="whitespace-nowrap text-foreground/80 font-bold">
                  {files.length} ASSETS LOADED
                </span>

                {/* BOTÓN CLEAR ALL (Ajustamos el margin-left para móviles) */}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    playDelete();
                    clearAllFiles();
                  }}
                  disabled={isProcessing}
                  className="ml-0 sm:ml-2 h-5 px-2 text-[9px] text-red-400 hover:text-red-500 hover:bg-red-500/10 border border-red-500/20"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  CLEAR
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* DERECHA: CONTROLES */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full xl:w-auto items-center justify-end">
          {/* --- CONTROLES MODO IMAGEN --- */}
          {mode === "image" && (
            <div className="flex flex-wrap gap-4 items-center bg-background/50 p-2 rounded-xl border border-border/50">
              {/* NUEVO: Toggle YouTube */}
              <div className="flex items-center gap-2">
                <Toggle
                  pressed={youtubePreset}
                  onPressedChange={setYoutubePreset}
                  disabled={isProcessing || isAllDone}
                  className="h-8 font-mono text-xs border border-red-500/30 data-[state=on]:bg-red-500/20 data-[state=on]:text-red-400 text-muted-foreground gap-2 transition-all"
                >
                  <Youtube className="w-3 h-3" />
                  YT THUMBNAIL (2MB)
                </Toggle>
              </div>

              <div className="w-px h-6 bg-border/50 hidden sm:block" />

              <div className="flex items-center gap-2">
                <Label
                  htmlFor="width"
                  className="font-mono text-[10px] text-muted-foreground uppercase px-2"
                >
                  Max Width
                </Label>
                <div className="relative">
                  <Input
                    id="width"
                    type="number"
                    value={maxWidth === 0 ? "" : maxWidth}
                    placeholder="Auto (1920)"
                    onChange={(e) => setMaxWidth(Number(e.target.value))}
                    disabled={isProcessing || isAllDone}
                    className="w-[140px] h-8 font-mono text-xs border-primary/20 bg-background/50 focus:border-primary/50 transition-colors"
                  />
                  <span className="absolute right-3 top-2 text-[9px] text-muted-foreground font-mono pointer-events-none">
                    px
                  </span>
                </div>
              </div>

              <div className="w-px h-6 bg-border/50 hidden sm:block" />

              <div className="flex items-center gap-2">
                <Label className="font-mono text-[10px] text-muted-foreground uppercase px-2">
                  Format
                </Label>
                <Select
                  value={outputFormat}
                  onValueChange={(v) => setOutputFormat(v as OutputFormat)}
                  disabled={isProcessing || isAllDone}
                >
                  <SelectTrigger className="w-[140px] h-8 font-mono text-xs border-primary/20 bg-background/50 focus:border-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    <SelectItem value="image/jpeg">JPG</SelectItem>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/webp">WEBP</SelectItem>
                    <SelectItem
                      value="image/avif"
                      className="font-bold text-violet-500"
                    >
                      AVIF (Ultra)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* --- CONTROLES MODO VIDEO --- */}
          {mode === "video" && (
            <div className="flex flex-wrap gap-3 items-center bg-violet-500/5 p-2 rounded-xl border border-violet-500/20">
              {/* FILA 1: TARGET SIZE */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[9px] text-violet-400/70 uppercase ml-1 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Target Size
                </Label>
                <Select
                  value={videoSettings.targetSize || "none"}
                  onValueChange={(v) =>
                    setVideoSettings((p) => ({
                      ...p,
                      targetSize: v === "none" ? null : (v as TargetSizePreset),
                    }))
                  }
                  disabled={
                    isProcessing || isAllDone || videoSettings.format !== "mp4"
                  }
                >
                  <SelectTrigger className="w-[150px] h-8 font-mono text-xs border-violet-500/30 text-violet-300 bg-violet-950/20 focus:ring-violet-500/50">
                    <SelectValue placeholder="Select Target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default (Auto)</SelectItem>
                    <SelectItem value="discord-8mb">Discord (8MB)</SelectItem>
                    <SelectItem value="whatsapp-16mb">
                      WhatsApp (16MB)
                    </SelectItem>
                    <SelectItem value="email-25mb">Email (25MB)</SelectItem>
                    <SelectItem value="custom-10mb">Custom (10MB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-px h-6 bg-violet-500/20 hidden sm:block mx-1" />

              {/* FILA 2: FORMATO DE SALIDA */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[9px] text-violet-400/70 uppercase ml-1 font-bold">
                  Output Format
                </Label>
                <Select
                  value={videoSettings.format}
                  onValueChange={(v) =>
                    setVideoSettings((p) => ({
                      ...p,
                      format: v as VideoSettings["format"],
                    }))
                  }
                  disabled={isProcessing || isAllDone}
                >
                  <SelectTrigger className="w-[80px] h-8 font-mono text-xs border-violet-500/30 text-violet-300 bg-violet-950/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4 (Video)</SelectItem>
                    <SelectItem value="gif">GIF (Anim)</SelectItem>
                    <SelectItem value="mp3">MP3 (Audio)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* FILA 3: TOGGLE AUDIO */}
              <div className="flex flex-col gap-1 items-center">
                <Label className="font-mono text-[9px] text-violet-400/70 uppercase">
                  Audio
                </Label>
                <Toggle
                  pressed={!videoSettings.removeAudio}
                  onPressedChange={(pressed) =>
                    setVideoSettings((p) => ({ ...p, removeAudio: !pressed }))
                  }
                  disabled={
                    isProcessing || isAllDone || videoSettings.format === "gif"
                  }
                  className="h-8 w-8 data-[state=on]:bg-violet-500/20 data-[state=on]:text-violet-300 border border-violet-500/30"
                >
                  {videoSettings.removeAudio ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Toggle>
              </div>

              {/* CONFIGURACIÓN AVANZADA */}
              {!videoSettings.targetSize && videoSettings.format === "mp4" && (
                <>
                  <div className="w-px h-6 bg-violet-500/20 hidden sm:block mx-1" />
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-[9px] text-violet-400/70 uppercase ml-1">
                      Res / FPS
                    </Label>
                    <div className="flex gap-1">
                      <Select
                        value={videoSettings.resolution}
                        onValueChange={(v) =>
                          setVideoSettings((p) => ({
                            ...p,
                            resolution: v as VideoSettings["resolution"],
                          }))
                        }
                        disabled={isProcessing || isAllDone}
                      >
                        <SelectTrigger className="w-[80px] h-8 font-mono text-xs border-violet-500/30 text-violet-300 bg-violet-950/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">Orig</SelectItem>
                          <SelectItem value="1080">1080p</SelectItem>
                          <SelectItem value="720">720p</SelectItem>
                          <SelectItem value="480">480p</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={videoSettings.fps}
                        onValueChange={(v) =>
                          setVideoSettings((p) => ({
                            ...p,
                            fps: v as VideoSettings["fps"],
                          }))
                        }
                        disabled={isProcessing || isAllDone}
                      >
                        <SelectTrigger className="w-[70px] h-8 font-mono text-xs border-violet-500/30 text-violet-300 bg-violet-950/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">Orig</SelectItem>
                          <SelectItem value="60">60fps</SelectItem>
                          <SelectItem value="30">30fps</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* BOTÓN START */}
          <div className="w-full sm:w-auto pl-2">
            {isAllDone ? (
              <Button
                size="lg"
                onClick={handleDownloadZip}
                className="w-full sm:w-auto h-12 rounded-full gap-2 shadow-[0_0_20px_-5px_var(--color-primary)] bg-primary hover:bg-primary/90 animate-in zoom-in duration-300 border-2 border-white/20"
              >
                <Archive className="w-5 h-5" />
                <span className="font-bold tracking-wide">DOWNLOAD PACK</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] ml-1 font-mono">
                  -{Math.round((totalSaved / totalOriginal) * 100)}%
                </span>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleCompressAll}
                disabled={isProcessing || !hasPending}
                className={cn(
                  "w-full sm:w-auto h-12 rounded-full gap-3 shadow-lg whitespace-nowrap transition-all duration-300 border-2 border-white/10",
                  isProcessing
                    ? "bg-muted cursor-not-allowed opacity-80"
                    : "hover:scale-105 active:scale-95",
                )}
              >
                {isProcessing ? (
                  <>
                    <Cpu className="w-5 h-5 animate-spin" />
                    <span className="animate-pulse font-mono">
                      PROCESSING...
                    </span>
                  </>
                ) : (
                  <>
                    <Zap
                      className={cn(
                        "w-5 h-5 fill-current",
                        mode === "video"
                          ? "text-violet-200"
                          : "text-yellow-200",
                      )}
                    />
                    <span className="font-black tracking-widest text-base">
                      START ENGINE
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* --- PANEL WATERMARK (NUEVO) --- */}
      <div className="w-full">
        <WatermarkPanel />
      </div>

      {/* Grid de Tarjetas */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {files.map((file) => (
            <FileCard key={file.id} fileData={file} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
