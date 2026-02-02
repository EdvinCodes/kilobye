import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KiloBye - Comprime sin perder calidad",
  description: "La herramienta de compresión de imágenes más rápida y privada.",
  icons: {
    icon: "/favicon.ico", // Asegúrate de tener un icono
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen selection:bg-primary/10`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Forzamos dark por defecto si quieres ese look "hacker"
          enableSystem
          disableTransitionOnChange
        >
          {/* --- FONDO "SENIOR" --- */}
          {/* 1. Grilla sutil de fondo */}
          <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            {/* 2. Luz/Gradiente central para dar foco */}
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          </div>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
