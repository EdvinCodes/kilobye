import { ImageResponse } from "next/og";

// Configuración de la imagen (Metadatos de la ruta)
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Generación del Favicon
export default function Icon() {
  // Define aquí tu color principal (HEX)
  // Como no podemos usar variables CSS (var(--primary)) en el servidor,
  // ponemos el color "hardcoded". Este es un Violeta intenso.
  const primaryColor = "#7c3aed"; // <--- CAMBIA ESTO POR TU COLOR DE MARCA
  const primaryLight = "#7c3aed1a"; // El mismo con transparencia (10%)

  return new ImageResponse(
    <div
      style={{
        fontSize: 24,
        background: "transparent", // Fondo transparente
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: primaryColor, // Esto actúa como "currentColor" para el SVG
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fondo sutil */}
        <rect
          width="32"
          height="32"
          rx="8"
          fill={primaryLight} // fill-primary/10
        />
        {/* Las "Prensas" */}
        <path
          d="M16 8V11"
          stroke={primaryColor} // stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M16 21V24"
          stroke={primaryColor} // stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* El Archivo Comprimido (Centro) */}
        <rect
          x="10"
          y="13"
          width="12"
          height="6"
          rx="1"
          fill={primaryColor} // fill-primary
          stroke={primaryColor} // stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </div>,
    // Opciones de ImageResponse
    {
      ...size,
    },
  );
}
