import confetti from "canvas-confetti";

export function triggerPixelConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  // Colores de tu marca (Morado, Blanco, Negro, Gris)
  const colors = ["#7c3aed", "#ffffff", "#000000", "#a78bfa"];

  (function frame() {
    // Lanzamos confeti desde dos lados (izquierda y derecha)
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
      shapes: ["square"], // <--- IMPORTANTE: Cuadrados para Pixel Art
      scalar: 2, // Más grandes para que se vean los pixeles
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
      shapes: ["square"],
      scalar: 2,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
