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
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        purpose: "any maskable" as any,
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        purpose: "any maskable" as any,
      },
    ],
  };
}
