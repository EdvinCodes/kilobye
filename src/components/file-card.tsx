"use client";

import { motion } from "framer-motion";
import { X, CheckCircle2, Loader2, Download } from "lucide-react";
import { ImageFile, useFileStore } from "@/store/file-store";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadBlob } from "@/lib/download-utils";
import Image from "next/image";

interface FileCardProps {
  fileData: ImageFile;
}

export function FileCard({ fileData }: FileCardProps) {
  const removeFile = useFileStore((state) => state.removeFile);

  // Función para descargar solo este archivo
  const handleDownload = () => {
    if (fileData.compressedFile) {
      downloadBlob(fileData.compressedFile, fileData.file.name);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="relative group overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 1. La Imagen de fondo / Preview */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/50">
        <Image
          src={fileData.preview}
          alt={fileData.file.name}
          width={500}
          height={500}
          unoptimized // IMPORTANTE: Vital para blobs locales
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Capa oscura (Overlay) al pasar el ratón */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* BOTONES DE ACCIÓN FLOTANTES */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Botón Descargar (Solo si está listo) */}
          {fileData.status === "done" && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-sm bg-white/90 hover:bg-white text-green-600 hover:text-green-700"
              onClick={handleDownload}
              title="Descargar imagen"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* Botón Borrar */}
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8 rounded-full shadow-sm"
            onClick={() => removeFile(fileData.id)}
            title="Eliminar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Información del archivo */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p
            className="font-medium truncate text-sm w-full"
            title={fileData.file.name}
          >
            {fileData.file.name}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {/* Lógica de visualización de peso */}
          <div className="flex flex-col">
            <span
              className={
                fileData.compressedSize ? "line-through opacity-50" : ""
              }
            >
              {formatBytes(fileData.originalSize)}
            </span>
            {fileData.compressedSize && (
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatBytes(fileData.compressedSize)}
              </span>
            )}
          </div>

          {/* Badges de Estado */}
          {fileData.status === "idle" && (
            <Badge
              variant="secondary"
              className="text-[10px] h-5 pointer-events-none"
            >
              Pendiente
            </Badge>
          )}

          {fileData.status === "compressing" && (
            <Badge
              variant="default"
              className="text-[10px] h-5 bg-blue-500 pointer-events-none"
            >
              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Procesando
            </Badge>
          )}

          {fileData.status === "done" && fileData.compressedSize && (
            <Badge
              variant="default"
              className="text-[10px] h-5 bg-green-500 hover:bg-green-600 pointer-events-none"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />-
              {Math.round(
                ((fileData.originalSize - fileData.compressedSize) /
                  fileData.originalSize) *
                  100,
              )}
              %
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
