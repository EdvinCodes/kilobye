import useSound from "use-sound";
import { useFileStore } from "@/store/file-store";

export function useRetroSound() {
  const isMuted = useFileStore((state) => state.isMuted);

  // Configuración base para todos los sonidos
  const soundConfig = { volume: 0.5, soundEnabled: !isMuted };

  const [playClick] = useSound("/sounds/click.wav", soundConfig);
  const [playDrop] = useSound("/sounds/drop.wav", {
    ...soundConfig,
    volume: 0.6,
  });
  const [playSuccess] = useSound("/sounds/success.wav", {
    ...soundConfig,
    volume: 0.4,
  });
  const [playDelete] = useSound("/sounds/delete.wav", {
    ...soundConfig,
    volume: 0.3,
  });

  return {
    playClick,
    playDrop,
    playSuccess,
    playDelete,
  };
}
