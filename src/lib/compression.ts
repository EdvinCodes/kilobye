import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
}

// Configuración por defecto "Equilibrada"
const defaultOptions: CompressionOptions = {
  maxSizeMB: 1,           // Intenta bajar a 1MB
  maxWidthOrHeight: 1920, // Full HD máximo (para ahorrar mucho peso)
  useWebWorker: true,     // Vital para no congelar la pantalla
};

export async function compressImage(file: File): Promise<Blob> {
  try {
    // Si es muy pequeña, no comprimimos agresivamente
    const options = {
      ...defaultOptions,
      // Si la imagen ya es pequeña (menos de 0.5MB), no la fuerces tanto
      maxSizeMB: file.size / 1024 / 1024 > 1 ? 1 : 0.8 
    };

    const compressedBlob = await imageCompression(file, options);
    return compressedBlob;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
}