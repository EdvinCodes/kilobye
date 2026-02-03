import type { Metadata } from "next";
import { VT323, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const pixelFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  // 1. BASE URL (IMPORTANTE): Cambia esto por tu dominio real cuando lo despliegues (ej: kilobye.vercel.app)
  // Si no pones esto, las imágenes sociales no cargarán en producción.
  metadataBase: new URL("https://kilobye.vercel.app"),

  title: {
    default: "KiloBye - Pixel Perfect Compression",
    template: "%s | KiloBye",
  },
  description:
    "Compresión de imágenes extrema, privada y sin servidores. Estilo Retro.",

  // 2. CONFIGURACIÓN PWA
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KiloBye",
  },

  // 3. TARJETAS PARA WHATSAPP, FACEBOOK, LINKEDIN, DISCORD (Open Graph)
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://kilobye.vercel.app", // Tu URL real
    title: "KiloBye - Compresión Extrema",
    description:
      "Reduce el peso de tus imágenes hasta un 90% sin perder calidad. 100% Privado. Modo Retro.",
    siteName: "KiloBye",
    images: [
      {
        url: "/og-image.png", // Asegúrate de crear esta imagen en /public (1200x630px)
        width: 1200,
        height: 630,
        alt: "KiloBye Preview",
      },
    ],
  },

  // 4. TARJETAS PARA TWITTER / X
  twitter: {
    card: "summary_large_image",
    title: "KiloBye - Make it smol",
    description:
      "Compresión de imágenes extrema en tu navegador. Sin servidores.",
    images: ["/og-image.png"], // Reusamos la misma imagen
    creator: "@EdvinCodes", // Tu usuario de Twitter (opcional)
  },

  // 5. ICONOS EXTRA (Favicon)
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${pixelFont.variable} ${geistSans.variable} ${geistMono.variable} antialiased font-sans selection:bg-primary selection:text-primary-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* FONDO MEJORADO */}
          <div
            className="fixed inset-0 -z-10 h-full w-full bg-background"
            style={{
              backgroundImage: `linear-gradient(to right, var(--grid-color) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          ></div>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
