"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Definimos la interfaz del evento nativo del navegador
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  platforms: string[];
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Tipamos el evento correctamente
    const handler = (e: Event) => {
      e.preventDefault();
      // Asumimos que el evento es del tipo correcto (Cast seguro)
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Mostramos el diálogo nativo
    await deferredPrompt.prompt();

    // Esperamos la decisión del usuario
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={handleInstall}
            className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black font-bold bg-yellow-400 text-black hover:bg-yellow-500 hover:translate-y-[-2px] transition-all font-mono"
          >
            <Download className="mr-2 h-4 w-4" /> INSTALAR APP
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
