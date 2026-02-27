"use client";

import { useRef } from "react";
import { useFileStore, type WatermarkPosition } from "@/store/file-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Stamp, Upload, X, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function WatermarkPanel() {
  const { watermark, setWatermark, clearWatermark } = useFileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Si ya había un logo cargado, limpiamos la URL anterior de la memoria RAM
      if (watermark.preview) {
        URL.revokeObjectURL(watermark.preview);
      }
      const previewUrl = URL.createObjectURL(file);
      setWatermark({ file, preview: previewUrl, isEnabled: true });
    }
  };

  // ESTADO DESACTIVADO: Botón simple para activar
  if (!watermark.isEnabled) {
    return (
      <div className="flex justify-center py-2">
        <Button
          variant="ghost"
          onClick={() => setWatermark({ isEnabled: true })}
          className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-border hover:border-primary/50 transition-all group rounded-xl px-6"
        >
          <Stamp className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          ACTIVATE WATERMARK MODULE
        </Button>
      </div>
    );
  }

  // ESTADO ACTIVADO: Panel Completo
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="w-full bg-card/30 border-2 border-dashed border-primary/20 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm"
      >
        {/* Background Decorativo */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none rotate-12">
          <Stamp className="w-48 h-48" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 relative z-10">
          {/* COLUMNA 1: UPLOAD & PREVIEW */}
          <div className="flex flex-col gap-3 w-full lg:w-1/4 min-w-[200px]">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-[10px] uppercase text-primary font-bold tracking-wider">
                Logo Source
              </Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
                onClick={clearWatermark}
                title="Remove Watermark"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-primary/5 group relative overflow-hidden bg-background/50",
                watermark.preview
                  ? "border-primary/50"
                  : "border-muted-foreground/20 hover:border-primary/50",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />

              {watermark.preview ? (
                <div className="relative w-full h-full p-4 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={watermark.preview}
                    alt="Watermark"
                    className="max-w-full max-h-full object-contain drop-shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                    <span className="text-white text-[10px] font-mono flex items-center gap-1 border border-white/50 px-2 py-1 rounded">
                      <Upload className="w-3 h-3" /> REPLACE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-mono text-muted-foreground font-bold">
                    UPLOAD PNG
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA 2: POSICIÓN (GRID) */}
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <Label className="font-mono text-[10px] uppercase text-primary font-bold flex items-center gap-2 tracking-wider">
              <LayoutGrid className="w-3 h-3" /> Position
            </Label>

            <div className="grid grid-cols-3 gap-2 w-[140px] aspect-square self-start bg-background/50 p-2 rounded-lg border border-border/50">
              <PositionBtn
                pos="top-left"
                current={watermark.position}
                onClick={() => setWatermark({ position: "top-left" })}
              />
              <div className="border border-border/5 bg-black/5 rounded" />
              <PositionBtn
                pos="top-right"
                current={watermark.position}
                onClick={() => setWatermark({ position: "top-right" })}
              />

              <div className="border border-border/5 bg-black/5 rounded" />
              <PositionBtn
                pos="center"
                current={watermark.position}
                onClick={() => setWatermark({ position: "center" })}
              />
              <div className="border border-border/5 bg-black/5 rounded" />

              <PositionBtn
                pos="bottom-left"
                current={watermark.position}
                onClick={() => setWatermark({ position: "bottom-left" })}
              />
              <div className="border border-border/5 bg-black/5 rounded" />
              <PositionBtn
                pos="bottom-right"
                current={watermark.position}
                onClick={() => setWatermark({ position: "bottom-right" })}
              />
            </div>
          </div>

          {/* COLUMNA 3: SLIDERS (AJUSTES FINOS) */}
          <div className="flex flex-col gap-5 w-full lg:flex-1 justify-center px-2">
            {/* Opacidad */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label className="font-mono text-[10px] uppercase text-muted-foreground">
                  Opacity
                </Label>
                <span className="font-mono text-xs font-bold text-primary">
                  {Math.round(watermark.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80"
                value={watermark.opacity}
                onChange={(e) =>
                  setWatermark({ opacity: parseFloat(e.target.value) })
                }
              />
            </div>

            {/* Escala */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label className="font-mono text-[10px] uppercase text-muted-foreground">
                  Size (Scale)
                </Label>
                <span className="font-mono text-xs font-bold text-primary">
                  {Math.round(watermark.scale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80"
                value={watermark.scale}
                onChange={(e) =>
                  setWatermark({ scale: parseFloat(e.target.value) })
                }
              />
            </div>

            {/* Margen */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label className="font-mono text-[10px] uppercase text-muted-foreground">
                  Margin
                </Label>
                <span className="font-mono text-xs font-bold text-primary">
                  {watermark.margin}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80"
                value={watermark.margin}
                onChange={(e) =>
                  setWatermark({ margin: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Subcomponente para los botones del grid
function PositionBtn({
  pos,
  current,
  onClick,
}: {
  pos: WatermarkPosition;
  current: WatermarkPosition;
  onClick: () => void;
}) {
  const isSelected = pos === current;
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border-2 transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95",
        isSelected
          ? "bg-primary border-primary text-primary-foreground shadow-[0_0_10px_-2px_var(--color-primary)]"
          : "bg-card border-muted-foreground/20 hover:border-primary/50",
      )}
    >
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isSelected ? "bg-background" : "bg-muted-foreground/40",
        )}
      />
    </button>
  );
}
