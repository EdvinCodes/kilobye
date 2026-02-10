"use client";
import { Image as ImageIcon, Film } from "lucide-react";
import { useFileStore } from "@/store/file-store";
import { cn } from "@/lib/utils";
import { useRetroSound } from "@/hooks/use-retro-sound";

export function ModeToggle() {
  const { mode, setMode } = useFileStore();
  const { playClick } = useRetroSound();

  const handleSwitch = (newMode: "image" | "video") => {
    if (mode !== newMode) {
      playClick();
      setMode(newMode);
    }
  };

  return (
    <div className="bg-muted p-1 rounded-lg border-2 border-foreground inline-flex relative shadow-[4px_4px_0px_0px_currentColor]">
      {/* Fondo deslizante */}
      <div
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background border-2 border-foreground rounded shadow-sm transition-all duration-300 ease-out",
          mode === "image" ? "left-1" : "left-[calc(50%+2px)]",
        )}
      />

      <button
        onClick={() => handleSwitch("image")}
        className={cn(
          "relative z-10 flex items-center gap-2 px-6 py-2 rounded-md text-xs font-mono font-bold transition-colors w-32 justify-center",
          mode === "image"
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <ImageIcon className="w-4 h-4" /> IMAGE
      </button>

      <button
        onClick={() => handleSwitch("video")}
        className={cn(
          "relative z-10 flex items-center gap-2 px-6 py-2 rounded-md text-xs font-mono font-bold transition-colors w-32 justify-center",
          mode === "video"
            ? "text-violet-500"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Film className="w-4 h-4" /> VIDEO
      </button>
    </div>
  );
}
