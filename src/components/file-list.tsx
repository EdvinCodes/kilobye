"use client";

import { useState } from "react";
import { useFileStore } from "@/store/file-store";
import { FileCard } from "./file-card";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Archive } from "lucide-react";
import { compressImage } from "@/lib/compression";
import { downloadAllAsZip } from "@/lib/download-utils";
import { useRetroSound } from "@/hooks/use-retro-sound";
import { triggerPixelConfetti } from "@/lib/confetti";

export function FileList() {
  const { playSuccess, playClick } = useRetroSound();
  const { files, updateFile } = useFileStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados derivados para la UI
  const isAllDone = files.length > 0 && files.every((f) => f.status === "done");
  const hasPending = files.some((f) => f.status !== "done");

  // Lógica de Compresión
  const handleCompressAll = async () => {
    setIsProcessing(true);
    playClick();

    // Filtramos solo las que faltan por comprimir
    const pendingFiles = files.filter((f) => f.status !== "done");

    // Ejecutamos en paralelo (Promesa masiva)
    await Promise.all(
      pendingFiles.map(async (imageFile) => {
        try {
          // 1. Estado: Cargando
          updateFile(imageFile.id, { status: "compressing" });

          // 2. Procesamiento real (WebWorker)
          const compressedBlob = await compressImage(imageFile.file);

          // 3. Estado: Listo
          updateFile(imageFile.id, {
            status: "done",
            compressedFile: compressedBlob,
            compressedSize: compressedBlob.size,
          });
        } catch (error) {
          console.error("Error en archivo:", imageFile.file.name, error);
          updateFile(imageFile.id, { status: "error" });
        }
      }),
    );

    playSuccess();
    triggerPixelConfetti();

    setIsProcessing(false);
  };

  // Lógica de Descarga ZIP
  const handleDownloadZip = () => {
    downloadAllAsZip(files);
  };

  // Si no hay archivos, no mostramos nada
  if (files.length === 0) return null;

  // Cálculos para el resumen
  const totalOriginal = files.reduce((acc, f) => acc + f.originalSize, 0);
  const totalCompressed = files.reduce(
    (acc, f) => acc + (f.compressedSize || f.originalSize),
    0,
  );
  const totalSaved = totalOriginal - totalCompressed;

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 space-y-8 pb-24 px-4">
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight self-start">
          Tus Imágenes{" "}
          <span className="text-muted-foreground text-lg ml-2">
            ({files.length})
          </span>
        </h2>

        {/* EL BOTÓN INTELIGENTE (Cambia de función) */}
        <div className="flex gap-2 w-full sm:w-auto">
          {isAllDone ? (
            <Button
              size="lg"
              onClick={handleDownloadZip}
              className="w-full sm:w-auto rounded-full gap-2 shadow-lg bg-primary hover:bg-primary/90 animate-in zoom-in duration-300"
            >
              <Archive className="w-4 h-4" />
              Descargar todo en ZIP
              <span className="bg-primary-foreground/20 px-2 py-0.5 rounded text-xs ml-1">
                -{Math.round((totalSaved / totalOriginal) * 100)}%
              </span>
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleCompressAll}
              disabled={isProcessing || !hasPending}
              className="w-full sm:w-auto rounded-full gap-2 shadow-lg shadow-primary/20"
            >
              {isProcessing ? (
                <>Comprimiendo...</>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" /> Comprimir Todo
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Grid de Tarjetas */}
      <motion.div
        layout
        // FIX RESPONSIVE:
        // grid-cols-1 (Móvil vertical) -> 1 columna grande
        // sm:grid-cols-2 (Móvil grande/Tablet) -> 2 columnas
        // md:grid-cols-3 (Laptop) -> 3 columnas
        // lg:grid-cols-4 (Desktop) -> 4 columnas
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
