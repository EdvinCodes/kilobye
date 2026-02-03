"use client";

import { useState } from "react";
import { useFileStore } from "@/store/file-store";
import { FileCard } from "./file-card";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Archive, Settings2 } from "lucide-react";
import { compressImage, type OutputFormat } from "@/lib/compression";
import { downloadAllAsZip } from "@/lib/download-utils";
import { triggerPixelConfetti } from "@/lib/confetti";
import { useRetroSound } from "@/hooks/use-retro-sound";

// Imports UI
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
  const { files, updateFile } = useFileStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { playSuccess, playClick } = useRetroSound();

  // Estados de configuración
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [maxWidth, setMaxWidth] = useState<number>(0);

  const isAllDone = files.length > 0 && files.every((f) => f.status === "done");
  const hasPending = files.some((f) => f.status !== "done");

  const handleCompressAll = async () => {
    setIsProcessing(true);
    playClick();

    const pendingFiles = files.filter((f) => f.status !== "done");

    await Promise.all(
      pendingFiles.map(async (imageFile) => {
        try {
          updateFile(imageFile.id, { status: "compressing" });

          // Pasamos el formato Y el tamaño máximo
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
        } catch (error) {
          console.error("Error:", error);
          updateFile(imageFile.id, { status: "error" });
        }
      }),
    );

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
            {files.length} ITEMS LOADED
          </p>
        </div>

        {/* CONTROLES (DERECHA) */}
        {/* AÑADIDO: flex-wrap para evitar desbordamiento en pantallas medianas */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full lg:w-auto items-center justify-end">
          {/* INPUT: TAMAÑO MÁXIMO */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label
              htmlFor="width"
              className="font-mono text-xs whitespace-nowrap"
            >
              MAX WIDTH:
            </Label>
            <div className="relative w-full sm:w-auto">
              <Input
                id="width"
                type="number"
                value={maxWidth === 0 ? "" : maxWidth}
                placeholder="Auto (1920)"
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxWidth(isNaN(val) ? 0 : val);
                }}
                disabled={isProcessing || isAllDone}
                // CAMBIO: w-[160px] para que quepa el texto holgadamente
                className="w-full sm:w-[160px] h-9 font-mono text-xs border-2 border-primary/20 pr-8 placeholder:text-muted-foreground/50"
                min={100}
                max={8000}
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-mono pointer-events-none">
                px
              </span>
            </div>
          </div>

          {/* INPUT: FORMATO */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label
              htmlFor="format"
              className="font-mono text-xs whitespace-nowrap"
            >
              OUTPUT:
            </Label>
            <Select
              value={outputFormat}
              onValueChange={(val) => setOutputFormat(val as OutputFormat)}
              disabled={isProcessing || isAllDone}
            >
              <SelectTrigger
                id="format"
                className="w-full sm:w-[140px] h-9 font-mono text-xs border-2 border-primary/20"
              >
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">ORIGINAL</SelectItem>
                <SelectItem value="image/jpeg">.JPG (Small)</SelectItem>
                <SelectItem value="image/png">.PNG (Crisp)</SelectItem>
                <SelectItem value="image/webp">.WEBP (Modern)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* BOTÓN START */}
          <div className="w-full sm:w-auto">
            {isAllDone ? (
              <Button
                size="lg"
                onClick={handleDownloadZip}
                className="w-full sm:w-auto rounded-full gap-2 shadow-lg bg-primary hover:bg-primary/90 animate-in zoom-in duration-300"
              >
                <Archive className="w-4 h-4" />
                ZIP DOWNLOAD
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
                  <>PROCESSING...</>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" /> START ENGINE
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
