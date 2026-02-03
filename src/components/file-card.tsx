"use client";

import { motion } from "framer-motion";
import { X, Download } from "lucide-react";
import { ImageFile, useFileStore } from "@/store/file-store";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download-utils";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRetroSound } from "@/hooks/use-retro-sound";

interface FileCardProps {
  fileData: ImageFile;
}

export function FileCard({ fileData }: FileCardProps) {
  const { playDelete } = useRetroSound();
  const removeFile = useFileStore((state) => state.removeFile);

  const handleDownload = () => {
    if (fileData.compressedFile) {
      downloadBlob(fileData.compressedFile, fileData.file.name);
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
        "border-2 border-foreground", // Borde negro fino
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#ffffff]", // Sombra dura adaptativa
        "hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_var(--color-primary)]",
        "transition-all duration-200",
      )}
    >
      {/* 1. Header estilo "Ventana Windows 95" o Barra de Vida */}
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

      {/* 2. La Imagen (RESPONSIVE FIX) */}
      {/* CAMBIO AQUI:
          - h-48: Altura fija en móvil (rectangular, ocupa menos espacio).
          - sm:h-auto sm:aspect-square: En pantallas grandes vuelve a ser cuadrado automático.
      */}
      <div className="relative w-full bg-muted border-b-2 border-foreground h-48 sm:h-auto sm:aspect-square">
        <Image
          src={fileData.preview}
          alt={fileData.file.name}
          // Usamos 'fill' para que la imagen se adapte perfectamente al contenedor padre (sea rectangular o cuadrado)
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
          className="object-cover rendering-pixelated" // rendering-pixelated fuerza el look retro
        />

        {/* Overlay de estado */}
        {fileData.status === "done" && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px] z-10">
            <div className="bg-green-500 text-black font-bold font-mono px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_black] rotate-[-10deg]">
              SAVED!
            </div>
          </div>
        )}
      </div>

      {/* 3. Stats estilo RPG */}
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

        {/* Botón de acción grande */}
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
