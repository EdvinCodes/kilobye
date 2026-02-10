import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KiloBye",
    short_name: "KiloBye",
    description: "Pixel Perfect Compression. Retro style.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/icon-192.png", // Busca en public/icon-192.png
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable", // Opcional, ayuda en Android
      },
      {
        src: "/icon-512.png", // Busca en public/icon-512.png
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
