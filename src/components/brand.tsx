import { useId } from "react";

// Dispatch's brand (spec decision 31): the Pulse look, with the speech bubble and sound wave from the Aurora
// option as the logo, drawn in Pulse colours.
export const BRAND = {
  cobalt: "#2B59FF",
  sun: "#FFD23F",
  ink: "#0D1440",
};

/**
 * The speech bubble and sound wave shape. `fill="gradient"` draws it in the original Aurora violet-to-peach
 * gradient (used only on /looks); Dispatch itself uses Pulse colours (see AppIcon).
 */
export function AuroraMark({ size, fill = "gradient", wave = "#FFFFFF" }: { size: number; fill?: string; wave?: string }) {
  const id = `aurora-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {fill === "gradient" && (
        <defs>
          <linearGradient id={id} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#7C5CFF" />
            <stop offset="0.55" stopColor="#FF5CA8" />
            <stop offset="1" stopColor="#FFB35C" />
          </linearGradient>
        </defs>
      )}
      <path d="M24 4a20 20 0 1 1-10.4 37.1L5 44l2.9-8.6A20 20 0 0 1 24 4z" fill={fill === "gradient" ? `url(#${id})` : fill} />
      <path d="M13 24c2.5-6 5-6 7.5 0s5 6 7.5 0 5-6 7.5 0" fill="none" stroke={wave} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Dispatch's app icon: a sunshine-yellow speech bubble with a cobalt sound wave, on a cobalt tile.
 * Must match scripts/icon.svg, which makes the Home Screen icons. `outlined` adds the Pulse navy
 * outline and drop shadow.
 */
export function AppIcon({ size, outlined }: { size: number; outlined?: boolean }) {
  return (
    <span
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        background: BRAND.cobalt,
        border: outlined ? `2px solid ${BRAND.ink}` : undefined,
        boxShadow: outlined ? `3px 3px 0 ${BRAND.ink}` : "0 1px 3px rgba(13,20,64,.25)",
      }}
      aria-hidden
    >
      <AuroraMark size={size * 0.64} fill={BRAND.sun} wave={BRAND.cobalt} />
    </span>
  );
}
