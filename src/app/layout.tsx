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
  // Asegúrate de que esto sea tu dominio real (o coméntalo si aún no tienes)
  metadataBase: new URL("https://kilobye.vercel.app"),

  title: {
    default: "KiloBye: Compresor de Imágenes Extremo, Privado y Gratis",
    template: "%s | KiloBye",
  },

  description:
    "Comprime imágenes JPG, PNG y WebP al instante sin perder calidad. Tecnología 100% privada: tus fotos nunca se suben a la nube. Rápido, gratis y estilo Pixel Art.",

  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KiloBye",
  },

  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://kilobye.vercel.app",
    // Replicamos el título optimizado aquí
    title: "KiloBye: Compresor de Imágenes Extremo, Privado y Gratis",
    description:
      "Comprime imágenes JPG, PNG y WebP al instante sin perder calidad. Tecnología 100% privada: tus fotos nunca se suben a la nube. Rápido, gratis y estilo Pixel Art.",
    siteName: "KiloBye",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KiloBye Preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    // Twitter permite títulos un pelín más cortos, pero este funciona bien
    title: "KiloBye - Compresión Extrema y Privada",
    description:
      "Reduce el peso de tus imágenes hasta un 90% en tu navegador. Sin servidores, 100% privado.",
    images: ["/og-image.png"],
    creator: "@EdvinCodes",
  },

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
