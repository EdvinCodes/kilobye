import { create } from 'zustand'

export interface ImageFile {
  id: string
  file: File
  preview: string
  status: 'idle' | 'compressing' | 'done' | 'error'
  originalSize: number
  compressedSize?: number
  compressedFile?: Blob // Aquí guardaremos el resultado
}

interface FileState {
  files: ImageFile[]
  addFiles: (newFiles: ImageFile[]) => void
  removeFile: (id: string) => void
  // NUEVA ACCIÓN: Para actualizar estado y resultado
  updateFile: (id: string, updates: Partial<ImageFile>) => void 
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
  addFiles: (newFiles) => set((state) => ({ 
    files: [...state.files, ...newFiles] 
  })),
  removeFile: (id) => set((state) => ({ 
    files: state.files.filter((f) => f.id !== id) 
  })),
  // IMPLEMENTACIÓN
  updateFile: (id, updates) => set((state) => ({
    files: state.files.map((f) => (f.id === id ? { ...f, ...updates } : f))
  })),
}))