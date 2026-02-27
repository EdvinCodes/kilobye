"use client";

import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { motion, type HTMLMotionProps } from "framer-motion";
import { UploadCloud, Image as ImageIcon, Film, Sparkles } from "lucide-react";
import { useFileStore } from "@/store/file-store";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { useRetroSound } from "@/hooks/use-retro-sound";

export function UploadDropzone() {
  const { addFiles, mode } = useFileStore();
  const { playDrop, playClick } = useRetroSound();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      playDrop();

      // Procesamos los archivos uno a uno para sacar metadatos
      const processedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          const id = uuidv4();
          const preview = URL.createObjectURL(file);
          let duration = 0;

          // Si es video, sacamos la duración con un truco del DOM
          if (file.type.startsWith("video/")) {
            try {
              duration = await new Promise<number>((resolve) => {
                const video = document.createElement("video");
                video.preload = "metadata";
                const tempUrl = URL.createObjectURL(file);

                video.onloadedmetadata = () => {
                  resolve(video.duration);
                  URL.revokeObjectURL(tempUrl);
                };
                video.onerror = () => {
                  resolve(0);
                  URL.revokeObjectURL(tempUrl);
                };
                video.src = tempUrl;
              });
            } catch (e) {
              console.error("Error leyendo duración", e);
            }
          }

          return {
            id,
            file,
            preview,
            status: "idle" as const,
            originalSize: file.size,
            duration, // <--- Guardamos el dato
          };
        }),
      );

      addFiles(processedFiles);
    },
    [addFiles, playDrop],
  );

  const acceptType: Accept =
    mode === "image"
      ? { "image/*": [".jpg", ".png", ".webp"] }
      : { "video/*": [".mp4", ".mov", ".webm"] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: mode === "video" ? 5 : 50,
    accept: acceptType,
  });

  return (
    <div className="w-full h-full p-2 md:p-4">
      <motion.div
        onClick={() => playClick()}
        {...(getRootProps() as unknown as HTMLMotionProps<"div">)}
        whileHover={{ scale: 1.002 }}
        whileTap={{ scale: 0.995 }}
        className={cn(
          "relative cursor-pointer group flex flex-col items-center justify-center text-center overflow-hidden",
          "w-full min-h-[400px] lg:min-h-[500px] bg-background/80 backdrop-blur-sm",
          "border-[6px] border-double border-foreground/20",
          "rounded-3xl",
          "transition-all duration-300 ease-out",
          isDragActive
            ? "border-primary bg-primary/5 shadow-[0_0_50px_-12px_var(--color-primary)] scale-[1.01]"
            : "hover:border-foreground/50 hover:shadow-xl",
        )}
      >
        <input {...getInputProps()} />

        {/* --- FONDO DINÁMICO (GRID) --- */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* --- UI DECORATIVA "TECH" --- */}
        <div className="absolute top-4 left-6 font-mono text-[10px] text-muted-foreground/60 flex gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          SYSTEM_READY
        </div>
        <div className="absolute top-4 right-6 font-mono text-[10px] text-muted-foreground/60">
          VER. 2.1.0 // {mode.toUpperCase()}_MODULE
        </div>

        {/* Esquinas Reforzadas */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-foreground transition-all group-hover:w-12 group-hover:h-12" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-foreground transition-all group-hover:w-12 group-hover:h-12" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-foreground transition-all group-hover:w-12 group-hover:h-12" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-foreground transition-all group-hover:w-12 group-hover:h-12" />

        {/* --- CONTENIDO CENTRAL --- */}
        <div className="relative z-10 flex flex-col items-center gap-6 p-8 max-w-xl">
          <div
            className={cn(
              "relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-dashed transition-all duration-500",
              isDragActive
                ? "border-primary bg-primary/10 rotate-180"
                : "border-muted-foreground/30 group-hover:border-primary/50",
            )}
          >
            <div
              className={cn(
                "transition-all duration-300",
                isDragActive
                  ? "scale-110 text-primary"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {isDragActive ? (
                <UploadCloud className="w-16 h-16 animate-bounce" />
              ) : mode === "video" ? (
                <Film className="w-16 h-16" />
              ) : (
                <ImageIcon className="w-16 h-16" />
              )}
            </div>

            {!isDragActive && (
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin-slow" />
            )}
          </div>

          <div className="space-y-4">
            <h3
              className={cn(
                "text-4xl md:text-5xl font-black retro-text tracking-wider transition-colors duration-300",
                isDragActive ? "text-primary" : "text-foreground",
              )}
            >
              {isDragActive ? "RELEASE NOW!" : `INSERT ${mode.toUpperCase()}`}
            </h3>

            <p className="text-sm md:text-base font-mono text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {isDragActive
                ? "Initiating upload sequence..."
                : "Drag & drop files here or click to browse cache."}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {mode === "image" ? (
                <>
                  <span className="px-2 py-1 text-[10px] font-bold font-mono border rounded bg-muted text-muted-foreground">
                    JPG
                  </span>
                  <span className="px-2 py-1 text-[10px] font-bold font-mono border rounded bg-muted text-muted-foreground">
                    PNG
                  </span>
                  <span className="px-2 py-1 text-[10px] font-bold font-mono border rounded bg-muted text-muted-foreground">
                    WEBP
                  </span>
                  <span className="px-2 py-1 text-[10px] font-bold font-mono border border-primary/50 rounded bg-primary/20 text-primary">
                    AVIF
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2 py-1 text-[10px] font-bold font-mono border rounded bg-muted text-muted-foreground">
                    MP4
                  </span>
                  <span className="px-2 py-1 text-[10px] font-bold font-mono border rounded bg-muted text-muted-foreground">
                    MOV
                  </span>
                  <span className="px-2 py-1 text-[10px] font-bold font-mono border rounded bg-muted text-muted-foreground">
                    WEBM
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none scanlines opacity-5" />
      </motion.div>
    </div>
  );
}
