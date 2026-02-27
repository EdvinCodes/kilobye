import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MediaType = "image" | "video";

// NUEVO: Configuración de Marca de Agua
export type WatermarkPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export interface WatermarkSettings {
  file: File | null;
  preview: string | null;
  opacity: number; // 0.1 a 1
  scale: number; // 10% a 50% del ancho del video/imagen
  position: WatermarkPosition;
  margin: number; // px desde el borde
  isEnabled: boolean;
}

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  status: "idle" | "compressing" | "done" | "error";
  originalSize: number;
  compressedSize?: number;
  compressedFile?: Blob;
  progress?: number;
  duration?: number;
}

interface FileState {
  files: MediaFile[];
  mode: MediaType;
  isMuted: boolean;
  // NUEVO: Estado de Watermark
  watermark: WatermarkSettings;

  toggleMute: () => void;
  setMode: (mode: MediaType) => void;
  addFiles: (newFiles: MediaFile[]) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<MediaFile>) => void;
  // NUEVO: Actions de Watermark
  setWatermark: (settings: Partial<WatermarkSettings>) => void;
  clearWatermark: () => void;
}

export const useFileStore = create<FileState>()(
  persist(
    (set) => ({
      files: [],
      mode: "image",
      isMuted: false,

      // Estado Inicial Watermark
      watermark: {
        file: null,
        preview: null,
        opacity: 0.8,
        scale: 0.2, // 20% del ancho
        position: "bottom-right",
        margin: 20,
        isEnabled: false,
      },

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      setMode: (mode) =>
        set((state) => {
          state.files.forEach((f) => URL.revokeObjectURL(f.preview));
          return { mode, files: [] };
        }),

      addFiles: (newFiles) =>
        set((state) => ({
          files: [...state.files, ...newFiles],
        })),

      removeFile: (id) =>
        set((state) => {
          const fileToRemove = state.files.find((f) => f.id === id);
          if (fileToRemove?.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
          }
          return {
            files: state.files.filter((f) => f.id !== id),
          };
        }),

      updateFile: (id, updates) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, ...updates } : f,
          ),
        })),

      setWatermark: (settings) =>
        set((state) => ({
          watermark: { ...state.watermark, ...settings },
        })),

      clearWatermark: () =>
        set((state) => {
          if (state.watermark.preview) {
            URL.revokeObjectURL(state.watermark.preview);
          }
          return {
            watermark: {
              ...state.watermark,
              file: null,
              preview: null,
              isEnabled: false,
            },
          };
        }),
    }),
    {
      name: "kilobye-storage",
      partialize: (state) => ({
        isMuted: state.isMuted,
        mode: state.mode,
        // Persistimos todo menos el archivo binario del watermark (no serializable)
        // Lo ideal sería guardar base64, pero por ahora reseteamos file al recargar
        // para evitar complejidad.
      }),
    },
  ),
);
