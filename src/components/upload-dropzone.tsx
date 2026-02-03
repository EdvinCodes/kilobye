"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, type HTMLMotionProps } from "framer-motion";
import { UploadCloud, Gamepad2 } from "lucide-react";
import { useFileStore, ImageFile } from "@/store/file-store";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

export function UploadDropzone() {
  const addFiles = useFileStore((state) => state.addFiles);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: ImageFile[] = acceptedFiles.map((file) => ({
        id: uuidv4(),
        file,
        preview: URL.createObjectURL(file),
        status: "idle",
        originalSize: file.size,
      }));
      addFiles(newFiles);
    },
    [addFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  return (
    // CAMBIO CLAVE: Quitamos py-8 y max-w-2xl.
    // Usamos 'w-full h-full p-2' para que llene el contenedor padre del page.tsx
    // dejando solo un margen mínimo de seguridad para las esquinas redondeadas.
    <div className="w-full h-full p-2 md:p-3">
      <motion.div
        {...(getRootProps() as unknown as HTMLMotionProps<"div">)}
        whileHover={{ scale: 1.005, translateY: -1 }} // Efecto más sutil para no salir del contenedor
        whileTap={{ scale: 0.995, translateY: 1 }}
        className={cn(
          // ESTILO PIXEL ART DURO
          "relative cursor-pointer flex flex-col items-center justify-center text-center",
          "w-full h-64 bg-background border-4 border-foreground", // Aseguramos w-full
          "shadow-[6px_6px_0px_0px_var(--color-primary)]", // Sombra ajustada
          "transition-all duration-200",
          isDragActive
            ? "translate-x-[4px] translate-y-[4px] shadow-none bg-primary/10"
            : "",
        )}
      >
        <input {...getInputProps()} />

        {/* Decoración de esquinas pixeladas (truco visual) */}
        <div className="absolute top-0 left-0 w-4 h-4 border-r-4 border-b-4 border-foreground bg-background -ml-[4px] -mt-[4px]" />
        <div className="absolute top-0 right-0 w-4 h-4 border-l-4 border-b-4 border-foreground bg-background -mr-[4px] -mt-[4px]" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-r-4 border-t-4 border-foreground bg-background -ml-[4px] -mb-[4px]" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-l-4 border-t-4 border-foreground bg-background -mr-[4px] -mb-[4px]" />

        <div className="flex flex-col items-center gap-4 z-10 p-6">
          {/* Icono animado */}
          <div
            className={cn(
              "p-4 border-2 border-foreground bg-card shadow-[4px_4px_0px_0px_currentColor]",
              isDragActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isDragActive ? (
              <UploadCloud className="w-10 h-10 animate-bounce" />
            ) : (
              <Gamepad2 className="w-10 h-10" />
            )}
          </div>

          <div className="space-y-2 font-pixel">
            <h3 className="text-2xl md:text-3xl font-bold retro-text tracking-wide">
              {isDragActive
                ? "DROP IT LIKE IT'S HOT!"
                : "INSERT IMAGES TO START"}
            </h3>
            <p className="text-xs md:text-sm font-mono text-muted-foreground bg-muted px-2 py-1 inline-block border border-border">
              [ JPG . PNG . WEBP ] - MAX 10MB
            </p>
          </div>
        </div>

        {/* Scanlines overlay */}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-10" />
      </motion.div>
    </div>
  );
}
