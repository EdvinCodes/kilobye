import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: "idle" | "compressing" | "done" | "error";
  originalSize: number;
  compressedSize?: number;
  compressedFile?: Blob; // Aquí guardaremos el resultado
}

interface FileState {
  files: ImageFile[];
  isMuted: boolean;
  toggleMute: () => void;
  addFiles: (newFiles: ImageFile[]) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<ImageFile>) => void;
}

export const useFileStore = create<FileState>()(
  persist(
    (set) => ({
      files: [],
      isMuted: false,

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      addFiles: (newFiles) =>
        set((state) => ({
          files: [...state.files, ...newFiles],
        })),
      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        })),
      updateFile: (id, updates) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, ...updates } : f,
          ),
        })),
    }),
    {
      name: "kilobye-storage", // Nombre para guardar en localStorage
      partialize: (state) => ({ isMuted: state.isMuted }), // Solo persistimos el Mute, no los archivos
    },
  ),
);
