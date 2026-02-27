// ✅ DESPUÉS — devuelve una función cancel()
import confetti from "canvas-confetti";

export function triggerPixelConfetti() {
  const duration = 1500; // reducido de 3000 — más snappy, menos CPU
  const end = Date.now() + duration;

  const colors = ["7c3aed", "ffffff", "000000", "a78bfa"];

  let rafId: number;

  function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
      shapes: ["square"],
      scalar: 2,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
      shapes: ["square"],
      scalar: 2,
    });

    if (Date.now() < end) {
      rafId = requestAnimationFrame(frame);
    }
  }

  rafId = requestAnimationFrame(frame);

  // Devuelve cancel por si el componente desmonta antes de que acabe
  return () => cancelAnimationFrame(rafId);
}
