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
  title: "KiloBye - Pixel Perfect Compression",
  description: "Make it smol. Retro style.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KiloBye",
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
          {/* FONDO MEJORADO:
            Usamos var(--grid-color) en lugar de un color fijo.
            Esto hace que la rejilla sea gris en Light Mode y blanca en Dark Mode automáticamente.
          */}
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
