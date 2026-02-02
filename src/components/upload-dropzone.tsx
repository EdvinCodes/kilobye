"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion"; // <-- 1. Importamos el tipo aquí
import { UploadCloud, Image as ImageIcon, FileWarning } from "lucide-react";
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

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/jpeg": [],
        "image/png": [],
        "image/webp": [],
      },
      maxSize: 10 * 1024 * 1024,
    });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        /* FIX TYPE-SAFE: 
           Convertimos las props del dropzone a 'unknown' y luego al tipo 
           exacto que espera motion.div (HTMLMotionProps<"div">).
           Esto satisface al linter y a TypeScript.
        */
        {...(getRootProps() as unknown as HTMLMotionProps<"div">)}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        animate={{
          borderColor: isDragActive ? "var(--primary)" : "var(--border)",
          backgroundColor: isDragActive ? "var(--accent)" : "transparent",
        }}
        className={cn(
          "relative group cursor-pointer flex flex-col items-center justify-center",
          "h-64 rounded-3xl border-2 border-dashed transition-colors",
          "hover:bg-muted/30",
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence>
          {isDragActive ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                {isDragReject ? (
                  <FileWarning className="w-10 h-10 animate-pulse text-destructive" />
                ) : (
                  <UploadCloud className="w-10 h-10 animate-bounce" />
                )}
              </div>
              <p className="text-xl font-bold text-primary">
                {isDragReject ? "¡Ese archivo no!" : "¡Suéltalas ya!"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="p-4 rounded-full bg-muted text-muted-foreground group-hover:scale-110 transition-transform duration-200">
                <ImageIcon className="w-10 h-10" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-medium text-foreground">
                  Arrastra tus imágenes aquí
                </p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, WebP (Max 10MB)
                </p>
              </div>

              <button className="mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow pointer-events-none">
                Seleccionar archivos
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
