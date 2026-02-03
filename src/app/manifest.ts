import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KiloBye - Compresor Arcade",
    short_name: "KiloBye",
    description: "Compresión de imágenes extrema, privada y sin conexión.",
    start_url: "/",
    display: "standalone", // Esto hace que se abra sin barra de navegador (como una app real)
    background_color: "#09090b", // Tu color de fondo dark
    theme_color: "#7c3aed", // Tu color primary (morado)
    orientation: "portrait",
    icons: [
      {
        src: "/web-app-manifest-192x192.png", // Nota: Necesitaremos generar estos iconos luego para que quede perfecto, pero por ahora definimos la estructura
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
