"use client";

import { motion } from "framer-motion";
import { X, Download, Play } from "lucide-react";
import { MediaFile, useFileStore } from "@/store/file-store"; // MediaFile
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download-utils";
import Image from "next/image";
import { cn, formatBytes, getCorrectFileName } from "@/lib/utils";
import { useRetroSound } from "@/hooks/use-retro-sound";

interface FileCardProps {
  fileData: MediaFile;
}

export function FileCard({ fileData }: FileCardProps) {
  const { playDelete } = useRetroSound();
  const { removeFile, mode } = useFileStore(); // Necesitamos el modo

  const handleDownload = () => {
    if (fileData.compressedFile) {
      // Si es video, forzamos .mp4, si es imagen usamos la lógica de extensión
      let correctName = fileData.file.name;

      if (mode === "video") {
        // Cambiar extensión a .mp4
        const parts = fileData.file.name.split(".");
        parts.pop();
        correctName = parts.join(".") + ".mp4";
      } else {
        correctName = getCorrectFileName(
          fileData.file.name,
          fileData.compressedFile,
        );
      }

      downloadBlob(fileData.compressedFile, correctName);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        "relative group overflow-hidden bg-card text-card-foreground",
        "border-2 border-foreground",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#ffffff]",
        "hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_var(--color-primary)]",
        "transition-all duration-200",
      )}
    >
      {/* Header */}
      <div className="h-6 bg-foreground text-background flex items-center justify-between px-2 py-0.5 select-none">
        <span className="text-[10px] font-bold font-mono truncate max-w-[80%] uppercase">
          {fileData.file.name}
        </span>
        <button
          onClick={() => {
            playDelete();
            removeFile(fileData.id);
          }}
          className="hover:text-red-500"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Media Preview */}
      <div className="relative w-full bg-muted border-b-2 border-foreground h-48 sm:h-auto sm:aspect-square group-hover:bg-black transition-colors">
        {/* Barra de Progreso (Solo Videos) */}
        {fileData.status === "compressing" &&
          fileData.progress !== undefined && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full h-4 bg-gray-800 border-2 border-white relative overflow-hidden">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${fileData.progress}%` }}
                />
              </div>
              <p className="text-green-500 font-pixel mt-2 text-xs blink">
                RENDERING... {fileData.progress}%
              </p>
            </div>
          )}

        {mode === "image" ? (
          <Image
            src={fileData.preview}
            alt={fileData.file.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            className="object-cover rendering-pixelated"
          />
        ) : (
          <>
            <video
              src={fileData.preview}
              className="w-full h-full object-cover"
              muted
              loop
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => e.currentTarget.pause()}
            />
            {/* Icono Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
              <Play className="w-10 h-10 text-white/80 fill-white/50" />
            </div>
          </>
        )}

        {/* Overlay SAVED */}
        {fileData.status === "done" && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px] z-10 pointer-events-none">
            <div className="bg-green-500 text-black font-bold font-mono px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_black] rotate-[-10deg]">
              SAVED!
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-3 space-y-2 font-mono text-xs">
        <div className="flex justify-between items-center border-b border-dashed border-foreground/30 pb-2">
          <span className="text-muted-foreground">SIZE:</span>
          <span>{formatBytes(fileData.originalSize)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">NEW:</span>
          {fileData.compressedSize ? (
            <span className="text-green-600 font-bold">
              {formatBytes(fileData.compressedSize)}
            </span>
          ) : (
            <span>???</span>
          )}
        </div>

        {fileData.status === "done" && (
          <Button
            onClick={handleDownload}
            className="w-full mt-2 h-8 text-[10px] font-bold border-2 border-foreground bg-primary text-primary-foreground hover:bg-primary/90 shadow-[2px_2px_0px_0px_black] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            GET LOOT <Download className="ml-2 h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
