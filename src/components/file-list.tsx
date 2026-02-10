"use client";

import { useState, useEffect } from "react";
import { useFileStore } from "@/store/file-store";
import { FileCard } from "./file-card";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Archive, Settings2 } from "lucide-react";
import { compressImage, type OutputFormat } from "@/lib/compression";
import { downloadAllAsZip } from "@/lib/download-utils";
import { triggerPixelConfetti } from "@/lib/confetti";
import { useRetroSound } from "@/hooks/use-retro-sound";
import { useFFmpeg, type VideoSettings } from "@/hooks/use-ffmpeg";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function FileList() {
  const { files, updateFile, mode } = useFileStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { playSuccess, playClick } = useRetroSound();

  const { compressVideo, load: loadFFmpeg, loaded: ffmpegLoaded } = useFFmpeg();

  // ESTADOS IMAGEN
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [maxWidth, setMaxWidth] = useState<number>(0);

  // ESTADOS VIDEO
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: "720",
    fps: "30",
    quality: "medium",
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
      await Promise.all(
        pendingFiles.map(async (imageFile) => {
          try {
            updateFile(imageFile.id, { status: "compressing" });
            const compressedBlob = await compressImage(
              imageFile.file,
              outputFormat,
              maxWidth,
            );
            updateFile(imageFile.id, {
              status: "done",
              compressedFile: compressedBlob,
              compressedSize: compressedBlob.size,
            });
          } catch {
            updateFile(imageFile.id, { status: "error" });
          }
        }),
      );
    } else {
      // --- MODO VIDEO ---
      for (const videoFile of pendingFiles) {
        try {
          updateFile(videoFile.id, { status: "compressing", progress: 0 });

          const compressedBlob = await compressVideo(
            videoFile.file,
            videoSettings,
            (progress) => updateFile(videoFile.id, { progress }),
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
    <div className="w-full max-w-5xl mx-auto mt-12 space-y-8 pb-24 px-4">
      {/* PANEL DE CONTROL */}
      <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-6 p-4 border-2 border-border bg-card/50 rounded-xl shadow-sm">
        <div className="flex flex-col gap-1 w-full lg:w-auto">
          <h2 className="text-2xl font-bold tracking-tight retro-text flex items-center gap-2">
            <Settings2 className="w-6 h-6" /> CONTROL PANEL
          </h2>
          <p className="text-muted-foreground text-xs font-mono">
            {files.length} ITEMS LOADED [{mode.toUpperCase()} MODE]
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full lg:w-auto items-center justify-end">
          {/* --- CONTROLES MODO IMAGEN --- */}
          {mode === "image" && (
            <>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label
                  htmlFor="width"
                  className="font-mono text-xs whitespace-nowrap"
                >
                  WIDTH:
                </Label>
                <div className="relative w-full sm:w-auto">
                  <Input
                    id="width"
                    type="number"
                    value={maxWidth === 0 ? "" : maxWidth}
                    placeholder="Auto"
                    onChange={(e) => setMaxWidth(Number(e.target.value))}
                    disabled={isProcessing || isAllDone}
                    className="w-full sm:w-[100px] h-9 font-mono text-xs border-2 border-primary/20"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-mono pointer-events-none">
                    px
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="font-mono text-xs whitespace-nowrap">
                  FMT:
                </Label>
                <Select
                  value={outputFormat}
                  onValueChange={(v) => setOutputFormat(v as OutputFormat)}
                  disabled={isProcessing || isAllDone}
                >
                  <SelectTrigger className="w-full sm:w-[120px] h-9 font-mono text-xs border-2 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    <SelectItem value="image/jpeg">JPG</SelectItem>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/webp">WEBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* --- CONTROLES MODO VIDEO --- */}
          {mode === "video" && (
            <>
              {/* Resolución */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="font-mono text-xs whitespace-nowrap">
                  RES:
                </Label>
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
                  <SelectTrigger className="w-full sm:w-[120px] h-9 font-mono text-xs border-2 border-violet-500/20 text-violet-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    <SelectItem value="1080">1080p</SelectItem>
                    <SelectItem value="720">720p</SelectItem>
                    <SelectItem value="480">480p</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* FPS */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="font-mono text-xs whitespace-nowrap">
                  FPS:
                </Label>
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
                  <SelectTrigger className="w-full sm:w-[90px] h-9 font-mono text-xs border-2 border-violet-500/20 text-violet-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Orig</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Calidad */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="font-mono text-xs whitespace-nowrap">
                  QUAL:
                </Label>
                <Select
                  value={videoSettings.quality}
                  onValueChange={(v) =>
                    setVideoSettings((p) => ({
                      ...p,
                      quality: v as VideoSettings["quality"],
                    }))
                  }
                  disabled={isProcessing || isAllDone}
                >
                  <SelectTrigger className="w-full sm:w-[100px] h-9 font-mono text-xs border-2 border-violet-500/20 text-violet-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Med</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* BOTÓN START */}
          <div className="w-full sm:w-auto">
            {isAllDone ? (
              <Button
                size="lg"
                onClick={handleDownloadZip}
                className="w-full sm:w-auto rounded-full gap-2 shadow-lg bg-primary hover:bg-primary/90 animate-in zoom-in duration-300"
              >
                <Archive className="w-4 h-4" /> ZIP
                <span className="bg-primary-foreground/20 px-2 py-0.5 rounded text-xs ml-1">
                  -{Math.round((totalSaved / totalOriginal) * 100)}%
                </span>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleCompressAll}
                disabled={isProcessing || !hasPending}
                className="w-full sm:w-auto rounded-full gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
              >
                {isProcessing ? (
                  <>WORKING...</>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" /> START
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
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
