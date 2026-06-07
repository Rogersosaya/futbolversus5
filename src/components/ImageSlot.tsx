import type { CSSProperties } from "react";

/**
 * A fillable image placeholder, standing in for the original `<image-slot>`
 * web component. When no `src` is provided it shows the empty-state caption;
 * later this will be backed by uploaded media (Supabase).
 */
export function ImageSlot({
  src,
  placeholder = "Suelta una foto",
  alt = "",
}: {
  src?: string;
  placeholder?: string;
  alt?: string;
}) {
  const base: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} style={{ ...base, objectFit: "cover" }} />
    );
  }

  return (
    <div
      aria-label={placeholder}
      style={{
        ...base,
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
        background:
          "repeating-linear-gradient(45deg,#0c111b,#0c111b 22px,#0a0e16 22px,#0a0e16 44px)",
        boxShadow: "inset 0 0 0 2px rgba(255,255,255,.08)",
        color: "var(--txt-4)",
        fontFamily: "var(--font-d)",
        fontWeight: 600,
        fontSize: 22,
        letterSpacing: ".12em",
      }}
    >
      <span>{placeholder}</span>
    </div>
  );
}
