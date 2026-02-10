import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MediaType = "image" | "video";

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  status: "idle" | "compressing" | "done" | "error";
  originalSize: number;
  compressedSize?: number;
  compressedFile?: Blob;
  progress?: number; // Para la barra de carga de video
}

interface FileState {
  files: MediaFile[];
  mode: MediaType;
  isMuted: boolean;
  
  toggleMute: () => void;
  setMode: (mode: MediaType) => void;
  addFiles: (newFiles: MediaFile[]) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<MediaFile>) => void;
}

export const useFileStore = create<FileState>()(
  persist(
    (set) => ({
      files: [],
      mode: "image",
      isMuted: false,

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      
      // Al cambiar de modo, borramos los archivos anteriores para no mezclar
      setMode: (mode) => set({ mode, files: [] }),

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
      name: "kilobye-storage",
      partialize: (state) => ({ isMuted: state.isMuted, mode: state.mode }),
    },
  ),
);