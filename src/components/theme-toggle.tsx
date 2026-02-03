"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useRetroSound } from "@/hooks/use-retro-sound";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { playClick } = useRetroSound();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-primary transition-colors"
      onClick={() => {
        playClick();
        setTheme(isDark ? "light" : "dark");
      }}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
}
