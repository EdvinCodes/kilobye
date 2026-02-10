"use client";

import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { motion, type HTMLMotionProps } from "framer-motion";
import { UploadCloud, Gamepad2, Film } from "lucide-react";
import { useFileStore, MediaFile } from "@/store/file-store"; // Nota el cambio a MediaFile
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { useRetroSound } from "@/hooks/use-retro-sound";

export function UploadDropzone() {
  const { addFiles, mode } = useFileStore();
  const { playDrop, playClick } = useRetroSound();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      playDrop();
      const newFiles: MediaFile[] = acceptedFiles.map((file) => ({
        id: uuidv4(),
        file,
        // URL.createObjectURL funciona tanto para <img src> como para <video src>
        preview: URL.createObjectURL(file),
        status: "idle",
        originalSize: file.size,
      }));
      addFiles(newFiles);
    },
    [addFiles, playDrop],
  );

  // CONFIGURACIÓN DINÁMICA SEGÚN MODO
  const acceptType: Accept =
    mode === "image"
      ? { "image/*": [".jpg", ".png", ".webp"] }
      : { "video/*": [".mp4", ".mov", ".webm"] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: mode === "video" ? 5 : 20,
    accept: acceptType, // Ahora TypeScript sabe que esto cumple con la interfaz Accept
  });

  return (
    <div className="w-full h-full p-2 md:p-3">
      <motion.div
        onClick={() => playClick()}
        {...(getRootProps() as unknown as HTMLMotionProps<"div">)}
        whileHover={{ scale: 1.005, translateY: -1 }}
        whileTap={{ scale: 0.995, translateY: 1 }}
        className={cn(
          "relative cursor-pointer flex flex-col items-center justify-center text-center",
          "w-full h-64 bg-background border-4 border-foreground",
          "shadow-[6px_6px_0px_0px_var(--color-primary)]",
          "transition-all duration-200",
          isDragActive
            ? "translate-x-[4px] translate-y-[4px] shadow-none bg-primary/10"
            : "",
        )}
      >
        <input {...getInputProps()} />

        {/* Esquinas pixeladas */}
        <div className="absolute top-0 left-0 w-4 h-4 border-r-4 border-b-4 border-foreground bg-background -ml-[4px] -mt-[4px]" />
        <div className="absolute top-0 right-0 w-4 h-4 border-l-4 border-b-4 border-foreground bg-background -mr-[4px] -mt-[4px]" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-r-4 border-t-4 border-foreground bg-background -ml-[4px] -mb-[4px]" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-l-4 border-t-4 border-foreground bg-background -mr-[4px] -mb-[4px]" />

        <div className="flex flex-col items-center gap-4 z-10 p-6">
          <div
            className={cn(
              "p-4 border-2 border-foreground bg-card shadow-[4px_4px_0px_0px_currentColor]",
              isDragActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isDragActive ? (
              <UploadCloud className="w-10 h-10 animate-bounce" />
            ) : mode === "video" ? (
              <Film className="w-10 h-10" />
            ) : (
              <Gamepad2 className="w-10 h-10" />
            )}
          </div>

          <div className="space-y-2 font-pixel">
            <h3 className="text-2xl md:text-3xl font-bold retro-text tracking-wide">
              {isDragActive
                ? "DROP IT LIKE IT'S HOT!"
                : `INSERT ${mode.toUpperCase()}S TO START`}
            </h3>
            <p className="text-xs md:text-sm font-mono text-muted-foreground bg-muted px-2 py-1 inline-block border border-border">
              {mode === "image"
                ? "[ JPG . PNG . WEBP ] - MAX 10MB"
                : "[ MP4 . MOV . WEBM ] - MAX 100MB"}
            </p>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none scanlines opacity-10" />
      </motion.div>
    </div>
  );
}
