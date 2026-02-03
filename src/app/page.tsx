"use client";

import { UploadDropzone } from "@/components/upload-dropzone";
import { FileList } from "@/components/file-list";
import Link from "next/link";
import { Github, Volume2, VolumeX } from "lucide-react";
import { useFileStore } from "@/store/file-store";
import { Button } from "@/components/ui/button";
// 1. IMPORTAMOS EL TOGGLE
import { ThemeToggle } from "@/components/theme-toggle";

// COMPONENTE LOGO
const KiloByeLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary"
  >
    <rect width="32" height="32" rx="8" className="fill-primary/10" />
    <path
      d="M16 8V11"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M16 21V24"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <rect
      x="10"
      y="13"
      width="12"
      height="6"
      rx="1"
      className="fill-primary"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export default function Home() {
  const { isMuted, toggleMute } = useFileStore();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <KiloByeLogo />
            <span className="font-bold tracking-tight text-lg font-mono">
              KiloBye
            </span>
          </div>

          <nav className="flex items-center gap-4">
            {/* 2. AÑADIMOS EL TOGGLE AQUÍ */}
            <ThemeToggle />

            {/* Botón de Sonido */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>

            <Link
              href="https://github.com/EdvinCodes/kilobye"
              target="_blank"
              className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline-block">GitHub</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start pt-12 md:pt-24 px-4 pb-10 md:pb-20 w-full">
        {/* HERO SECTION */}
        <div className="text-center space-y-6 md:space-y-8 mb-10 md:mb-16 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="retro-text text-5xl md:text-8xl font-black tracking-widest text-foreground leading-none mb-4 drop-shadow-[4px_4px_0_rgba(255,0,0,0.5)]">
            KILO<span className="text-primary">BYE</span>
          </h1>
          <p className="font-mono text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
            &gt; PRESS START TO COMPRESS_
          </p>

          <p className="text-lg md:text-2xl text-muted-foreground max-w-xs sm:max-w-2xl mx-auto leading-relaxed font-light">
            Compresión extrema en tu navegador.
            <br className="hidden sm:block" />
            <span className="text-foreground/80 font-normal block sm:inline mt-2 sm:mt-0">
              Sin servidores. 100% Privado.
            </span>
          </p>
        </div>

        {/* ZONA DE ACCIÓN */}
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 px-2 sm:px-0">
          <div className="relative group">
            <div className="absolute -inset-0.5 md:-inset-1 bg-gradient-to-r from-primary/20 to-violet-500/20 rounded-[1.5rem] md:rounded-[2rem] blur-xl md:blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>

            <div className="relative bg-background rounded-[1.5rem] md:rounded-[2rem] ring-1 ring-border/50 overflow-hidden">
              <UploadDropzone />
            </div>
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="w-full mt-12 animate-in fade-in duration-1000 delay-300">
          <FileList />
        </div>
      </main>

      <footer className="py-8 text-center text-xs md:text-sm text-muted-foreground/60 border-t border-border/20 px-4">
        <p>KiloBye © 2026</p>
      </footer>
    </div>
  );
}
