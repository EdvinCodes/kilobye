import type { Metadata } from "next";
// 1. IMPORTAMOS LA FUENTE PIXELADA
import { VT323, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// Configuración de la fuente Pixel
const pixelFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel", // Variable CSS para usarla en Tailwind
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KiloBye - Pixel Perfect Compression",
  description: "Make it smol. Retro style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        // 2. AÑADIMOS LA VARIABLE DE LA FUENTE AQUI
        className={`${pixelFont.variable} ${geistSans.variable} ${geistMono.variable} antialiased font-sans selection:bg-primary selection:text-primary-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // El pixel art queda mejor en oscuro
          enableSystem
          disableTransitionOnChange
        >
          {/* Fondo Retro: Una cuadrícula más marcada */}
          <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
