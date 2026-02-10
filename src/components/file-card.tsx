"use client";

import { motion } from "framer-motion";
import {
  X,
  Download,
  Play,
  FileVideo,
  FileImage,
  FileAudio,
  Film,
} from "lucide-react"; // Importa FileAudio y Film
import { MediaFile, useFileStore } from "@/store/file-store";
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
  const { removeFile, mode } = useFileStore();

  const handleDownload = () => {
    if (fileData.compressedFile) {
      // Usamos la función inteligente que mira el MIME type del blob resultante
      // Ya no forzamos .mp4 a ciegas
      const correctName = getCorrectFileName(
        fileData.file.name,
        fileData.compressedFile,
      );
      downloadBlob(fileData.compressedFile, correctName);
    }
  };

  // Determinar icono basado en el resultado (si existe) o en el modo
  const getIcon = () => {
    if (fileData.compressedFile?.type.startsWith("audio"))
      return <FileAudio className="w-3 h-3 text-yellow-400" />;
    if (fileData.compressedFile?.type === "image/gif")
      return <Film className="w-3 h-3 text-pink-400" />;
    if (mode === "image")
      return <FileImage className="w-3 h-3 text-muted-foreground" />;
    return <FileVideo className="w-3 h-3 text-violet-400" />;
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        "relative group overflow-hidden bg-card text-card-foreground rounded-xl",
        "border-[1px] border-border/60",
        "shadow-lg hover:shadow-2xl transition-all duration-300",
        mode === "image"
          ? "hover:border-primary/50 hover:shadow-[0_10px_40px_-15px_rgba(255,100,0,0.3)]"
          : "hover:border-violet-500/50 hover:shadow-[0_10px_40px_-15px_rgba(139,92,246,0.3)]",
      )}
    >
      {/* --- HEADER --- */}
      <div className="h-9 bg-muted/50 border-b border-border/40 flex items-center justify-between px-3 select-none">
        <div className="flex items-center gap-2 max-w-[85%]">
          {getIcon()}
          <span className="text-[10px] font-bold font-mono truncate uppercase tracking-tight text-foreground/80">
            {fileData.file.name}
          </span>
        </div>
        <button
          onClick={() => {
            playDelete();
            removeFile(fileData.id);
          }}
          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-1 rounded-md transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* --- PREVIEW AREA --- */}
      <div className="relative w-full h-48 sm:h-auto sm:aspect-square bg-black/5 dark:bg-black/40 overflow-hidden flex items-center justify-center">
        {/* CRT SCANLINES */}
        <div
          className="absolute inset-0 z-10 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"
          style={{ backgroundSize: "100% 2px, 3px 100%" }}
        />

        {/* LOADING BAR */}
        {fileData.status === "compressing" &&
          fileData.progress !== undefined && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6">
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2 border border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${fileData.progress}%` }}
                />
              </div>
              <div className="flex justify-between w-full text-[10px] font-mono text-green-400">
                <span className="animate-pulse">PROCESSING</span>
                <span>{fileData.progress}%</span>
              </div>
            </div>
          )}

        {/* CONTENIDO REAL */}
        {fileData.compressedFile?.type.startsWith("audio") ? (
          // VISTA PREVIA DE AUDIO (Onda sonora estática)
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
            <FileAudio className="w-16 h-16 text-yellow-500/50 animate-pulse" />
          </div>
        ) : // VISTA PREVIA VISUAL (Imagen o Video)
        mode === "image" ? (
          <Image
            src={fileData.preview}
            alt={fileData.file.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <>
            <video
              src={fileData.preview}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              muted
              loop
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => e.currentTarget.pause()}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
          </>
        )}

        {/* STAMP "SAVED" */}
        {fileData.status === "done" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 2, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: -10 }}
              className="border-[3px] border-green-500 text-green-500 font-black font-mono px-4 py-1 text-xl rounded-lg bg-green-950/40 backdrop-blur-sm shadow-[0_0_15px_-3px_rgba(34,197,94,0.6)]"
            >
              {fileData.compressedFile?.type.includes("gif")
                ? "GIF READY"
                : "SAVED"}
            </motion.div>
          </div>
        )}
      </div>

      {/* --- INFO FOOTER --- */}
      <div className="p-3 bg-card space-y-3 font-mono text-[10px]">
        <div className="grid grid-cols-2 gap-2 text-muted-foreground/80">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase opacity-50">Original</span>
            <span className="font-bold text-foreground">
              {formatBytes(fileData.originalSize)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] uppercase opacity-50">Optimized</span>
            {fileData.compressedSize ? (
              <span className="font-bold text-green-500">
                {formatBytes(fileData.compressedSize)}
              </span>
            ) : (
              <span>---</span>
            )}
          </div>
        </div>

        {fileData.status === "done" && (
          <Button
            onClick={handleDownload}
            className="w-full h-8 text-[10px] font-bold tracking-widest bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 shadow-md"
          >
            <Download className="mr-2 h-3 w-3" />
            {fileData.compressedFile?.type.includes("audio")
              ? "DOWNLOAD MP3"
              : "GET FILE"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
