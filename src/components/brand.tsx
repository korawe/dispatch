import { useId } from "react";

/** Dispatch's logo (from the Aurora option): a speech bubble with a sound wave, in a violet-to-peach gradient. */
export function AuroraMark({ size, fill = "gradient", wave = "#FFFFFF" }: { size: number; fill?: string; wave?: string }) {
  const id = `aurora-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id={id} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7C5CFF" />
          <stop offset="0.55" stopColor="#FF5CA8" />
          <stop offset="1" stopColor="#FFB35C" />
        </linearGradient>
      </defs>
      <path d="M24 4a20 20 0 1 1-10.4 37.1L5 44l2.9-8.6A20 20 0 0 1 24 4z" fill={fill === "gradient" ? `url(#${id})` : fill} />
      <path d="M13 24c2.5-6 5-6 7.5 0s5 6 7.5 0 5-6 7.5 0" fill="none" stroke={wave} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

/** Dispatch's app icon: the logo on a deep indigo tile. `outlined` adds the Pulse navy outline and drop shadow. */
export function AuroraIcon({ size, outlined }: { size: number; outlined?: boolean }) {
  return (
    <span
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        background: "radial-gradient(90% 90% at 20% 10%, #2A1F5C, #0E0B1F)",
        border: outlined ? "2px solid #0D1440" : undefined,
        boxShadow: outlined ? "3px 3px 0 #0D1440" : "0 1px 3px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.08)",
      }}
      aria-hidden
    >
      <AuroraMark size={size * 0.64} />
    </span>
  );
}
