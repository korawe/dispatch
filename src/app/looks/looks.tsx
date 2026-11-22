"use client";

// Five look-and-feel directions for Dispatch: logo, colours, type and how the app's main screens would
// look. Each option is a set of CSS variables; the whole page takes on whichever option is chosen.
// Your favourite and notes are saved on this device, and "Copy my feedback" puts them on the clipboard.

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { AuroraMark } from "@/components/brand";

/* ---------- the five options ---------- */

type LookId = "signal" | "aurora" | "paper" | "pulse" | "graphite";
type Tone = "bg" | "primary" | "icon";

type Look = {
  id: LookId;
  name: string;
  tagline: string;
  vibe: string;
  fonts: { display: string; body: string };
  dark: boolean;
  /** Design tokens, applied as CSS variables. */
  vars: Record<string, string>;
  swatches: { name: string; hex: string }[];
  /** Logo colours [main, second] on the app background, on the primary colour, and on the app icon. */
  markColors: Record<Tone, [string, string]>;
  iconBg: string;
  wordmark: { text: string; style: CSSProperties; scale?: number; dot?: string };
};

const LOOKS: Look[] = [
  {
    id: "signal",
    name: "Signal",
    tagline: "Speak it. Ship it.",
    vibe: "Dark and sharp, with an electric lime accent and a monospaced edge. The logo is a voice level that turns into a send arrow. It feels like a pro tool.",
    fonts: { display: "Space Grotesk", body: "Inter" },
    dark: true,
    vars: {
      "--page": "#050506",
      "--bg": "#0A0A0C",
      "--bg-solid": "#0A0A0C",
      "--surface": "#141418",
      "--surface2": "#1D1D23",
      "--border": "#26262E",
      "--hair": "#26262E",
      "--bw": "1px",
      "--text": "#F4F4F5",
      "--muted": "#8B8B96",
      "--accent": "#C6FF3D",
      "--primary": "#C6FF3D",
      "--on-primary": "#0A0A0C",
      "--record": "#C6FF3D",
      "--on-record": "#0A0A0C",
      "--btn-border": "none",
      "--chip": "#1D1D23",
      "--on-chip": "#F4F4F5",
      "--overdue": "#FF6B6B",
      "--overdue-bg": "rgba(255,107,107,.12)",
      "--r-card": "16px",
      "--r-btn": "999px",
      "--r-chip": "999px",
      "--shadow": "none",
      "--shadow-btn": "0 0 0 1px rgba(198,255,61,.25), 0 10px 32px -8px rgba(198,255,61,.45)",
      "--blur": "none",
      "--frame": "#2A2A33",
      "--display": "var(--font-space-grotesk)",
      "--body": "var(--font-inter)",
      "--mono": "var(--font-geist-mono)",
      "--meta-font": "var(--font-geist-mono)",
      "--label-font": "var(--font-geist-mono)",
      "--label-transform": "uppercase",
      "--label-tracking": "0.08em",
      "--display-weight": "600",
      "--display-tracking": "-0.03em",
    },
    swatches: [
      { name: "Ink", hex: "#0A0A0C" },
      { name: "Carbon", hex: "#141418" },
      { name: "Steel", hex: "#26262E" },
      { name: "Fog", hex: "#8B8B96" },
      { name: "Chalk", hex: "#F4F4F5" },
      { name: "Volt", hex: "#C6FF3D" },
    ],
    markColors: { bg: ["#C6FF3D", "#C6FF3D"], primary: ["#0A0A0C", "#0A0A0C"], icon: ["#C6FF3D", "#C6FF3D"] },
    iconBg: "#0A0A0C",
    wordmark: { text: "dispatch", style: { fontFamily: "var(--font-space-grotesk)", fontWeight: 700, letterSpacing: "-0.05em" } },
  },
  {
    id: "aurora",
    name: "Aurora",
    tagline: "Your voice, turned into action.",
    vibe: "Deep indigo with a glowing violet-to-peach gradient and frosted-glass cards. The logo is a speech bubble with a sound wave. It feels like a modern AI app.",
    fonts: { display: "Sora", body: "Plus Jakarta Sans" },
    dark: true,
    vars: {
      "--page":
        "radial-gradient(90% 60% at 10% 0%, rgba(124,92,255,.35), transparent 60%), radial-gradient(80% 60% at 100% 40%, rgba(255,92,168,.18), transparent 60%), #0B0918",
      "--bg":
        "radial-gradient(120% 70% at 0% 0%, rgba(124,92,255,.45), transparent 60%), radial-gradient(100% 60% at 100% 100%, rgba(255,140,92,.25), transparent 60%), #0E0B1F",
      "--bg-solid": "#0E0B1F",
      "--surface": "rgba(255,255,255,.07)",
      "--surface2": "rgba(255,255,255,.11)",
      "--border": "rgba(255,255,255,.14)",
      "--hair": "rgba(255,255,255,.1)",
      "--bw": "1px",
      "--text": "#F5F3FF",
      "--muted": "#B4AED6",
      "--accent": "#B9A6FF",
      "--primary": "linear-gradient(135deg, #6E4DFF 0%, #B8448F 55%, #C9603A 100%)",
      "--on-primary": "#FFFFFF",
      "--record": "linear-gradient(135deg, #7C5CFF 0%, #FF5CA8 55%, #FFB35C 100%)",
      "--on-record": "#FFFFFF",
      "--btn-border": "none",
      "--chip": "rgba(255,255,255,.1)",
      "--on-chip": "#F5F3FF",
      "--overdue": "#FF9DBD",
      "--overdue-bg": "rgba(255,92,168,.16)",
      "--r-card": "22px",
      "--r-btn": "999px",
      "--r-chip": "999px",
      "--shadow": "0 10px 40px -12px rgba(0,0,0,.5)",
      "--shadow-btn": "0 10px 36px -8px rgba(255,92,168,.55)",
      "--blur": "blur(18px)",
      "--frame": "rgba(255,255,255,.16)",
      "--display": "var(--font-sora)",
      "--body": "var(--font-plus-jakarta)",
      "--mono": "var(--font-geist-mono)",
      "--meta-font": "var(--font-plus-jakarta)",
      "--label-font": "var(--font-plus-jakarta)",
      "--label-transform": "none",
      "--label-tracking": "0",
      "--display-weight": "600",
      "--display-tracking": "-0.02em",
    },
    swatches: [
      { name: "Night", hex: "#0E0B1F" },
      { name: "Violet", hex: "#7C5CFF" },
      { name: "Orchid", hex: "#FF5CA8" },
      { name: "Peach", hex: "#FFB35C" },
      { name: "Lavender", hex: "#B4AED6" },
      { name: "Mist", hex: "#F5F3FF" },
    ],
    markColors: { bg: ["gradient", "#FFFFFF"], primary: ["#FFFFFF", "#6E4DFF"], icon: ["gradient", "#FFFFFF"] },
    iconBg: "radial-gradient(90% 90% at 20% 10%, #2A1F5C, #0E0B1F)",
    wordmark: { text: "Dispatch", style: { fontFamily: "var(--font-sora)", fontWeight: 600, letterSpacing: "-0.03em" } },
  },
  {
    id: "paper",
    name: "Paper",
    tagline: "Delegate, beautifully.",
    vibe: "Warm paper white, ink black and a tomato-red accent, with an elegant serif for headings. The logo is a postmark. Calm and premium, like a well-made notebook.",
    fonts: { display: "Instrument Serif", body: "DM Sans" },
    dark: false,
    vars: {
      "--page": "#EFE9DE",
      "--bg": "#F6F2EA",
      "--bg-solid": "#F6F2EA",
      "--surface": "#FFFDF8",
      "--surface2": "#EFE9DD",
      "--border": "#E2D9C8",
      "--hair": "#E2D9C8",
      "--bw": "1px",
      "--text": "#1A1814",
      "--muted": "#6B6458",
      "--accent": "#D93A1E",
      "--primary": "#1A1814",
      "--on-primary": "#F6F2EA",
      "--record": "#D93A1E",
      "--on-record": "#FFFFFF",
      "--btn-border": "none",
      "--chip": "#EFE9DD",
      "--on-chip": "#1A1814",
      "--overdue": "#B8301A",
      "--overdue-bg": "#FBE4DC",
      "--r-card": "8px",
      "--r-btn": "8px",
      "--r-chip": "6px",
      "--shadow": "0 1px 0 rgba(26,24,20,.04), 0 12px 28px -18px rgba(26,24,20,.35)",
      "--shadow-btn": "0 10px 24px -12px rgba(217,58,30,.6)",
      "--blur": "none",
      "--frame": "#D9CFBD",
      "--display": "var(--font-instrument-serif)",
      "--body": "var(--font-dm-sans)",
      "--mono": "var(--font-geist-mono)",
      "--meta-font": "var(--font-dm-sans)",
      "--label-font": "var(--font-dm-sans)",
      "--label-transform": "uppercase",
      "--label-tracking": "0.12em",
      "--display-weight": "400",
      "--display-tracking": "-0.01em",
    },
    swatches: [
      { name: "Paper", hex: "#F6F2EA" },
      { name: "Linen", hex: "#EFE9DD" },
      { name: "Ink", hex: "#1A1814" },
      { name: "Stone", hex: "#6B6458" },
      { name: "Tomato", hex: "#D93A1E" },
      { name: "Blush", hex: "#FBE4DC" },
    ],
    markColors: { bg: ["#1A1814", "#D93A1E"], primary: ["#F6F2EA", "#FF8A6E"], icon: ["#1A1814", "#D93A1E"] },
    iconBg: "#F6F2EA",
    wordmark: { text: "Dispatch", style: { fontFamily: "var(--font-instrument-serif)", fontWeight: 400, letterSpacing: "-0.01em" }, scale: 1.25, dot: "#D93A1E" },
  },
  {
    id: "pulse",
    name: "Pulse",
    tagline: "Say it once. Done.",
    vibe: "Bright cobalt and sunny yellow, chunky type, bold outlines and solid drop shadows. The logo is a speech bubble shaped like a D, with a send arrow. Energetic and fun without being childish.",
    fonts: { display: "Bricolage Grotesque", body: "Outfit" },
    dark: false,
    vars: {
      "--page": "#E4E9FF",
      "--bg": "#F3F5FF",
      "--bg-solid": "#F3F5FF",
      "--surface": "#FFFFFF",
      "--surface2": "#E8ECFF",
      "--border": "#0D1440",
      "--hair": "#D3DAF7",
      "--bw": "2px",
      "--text": "#0D1440",
      "--muted": "#4F5885",
      "--accent": "#2B59FF",
      "--primary": "#2B59FF",
      "--on-primary": "#FFFFFF",
      "--record": "#2B59FF",
      "--on-record": "#FFD23F",
      "--btn-border": "2px solid #0D1440",
      "--chip": "#FFD23F",
      "--on-chip": "#0D1440",
      "--overdue": "#0D1440",
      "--overdue-bg": "#FF8FA3",
      "--r-card": "18px",
      "--r-btn": "14px",
      "--r-chip": "999px",
      "--shadow": "3px 3px 0 #0D1440",
      "--shadow-btn": "4px 4px 0 #0D1440",
      "--blur": "none",
      "--frame": "#0D1440",
      "--display": "var(--font-bricolage)",
      "--body": "var(--font-outfit)",
      "--mono": "var(--font-geist-mono)",
      "--meta-font": "var(--font-outfit)",
      "--label-font": "var(--font-outfit)",
      "--label-transform": "uppercase",
      "--label-tracking": "0.06em",
      "--display-weight": "800",
      "--display-tracking": "-0.03em",
    },
    swatches: [
      { name: "Cobalt", hex: "#2B59FF" },
      { name: "Sunshine", hex: "#FFD23F" },
      { name: "Navy", hex: "#0D1440" },
      { name: "Cloud", hex: "#F3F5FF" },
      { name: "Periwinkle", hex: "#E8ECFF" },
      { name: "Candy", hex: "#FF8FA3" },
    ],
    markColors: { bg: ["#2B59FF", "#FFD23F"], primary: ["#FFD23F", "#2B59FF"], icon: ["#FFD23F", "#2B59FF"] },
    iconBg: "#2B59FF",
    wordmark: { text: "dispatch", style: { fontFamily: "var(--font-bricolage)", fontWeight: 800, letterSpacing: "-0.04em" } },
  },
  {
    id: "graphite",
    name: "Graphite",
    tagline: "Voice in. Email out.",
    vibe: "Monochrome graphite with a single safety-orange accent, sharp corners and monospaced details. The logo is a D with a recording light. Minimal, technical and precise.",
    fonts: { display: "Geist", body: "Geist + Geist Mono" },
    dark: true,
    vars: {
      "--page": "#0A0A0A",
      "--bg": "#111111",
      "--bg-solid": "#111111",
      "--surface": "#191919",
      "--surface2": "#232323",
      "--border": "#2C2C2C",
      "--hair": "#2C2C2C",
      "--bw": "1px",
      "--text": "#EDEDED",
      "--muted": "#8F8F8F",
      "--accent": "#FF6B00",
      "--primary": "#FF6B00",
      "--on-primary": "#111111",
      "--record": "#FF6B00",
      "--on-record": "#111111",
      "--btn-border": "none",
      "--chip": "#232323",
      "--on-chip": "#EDEDED",
      "--overdue": "#FF6B00",
      "--overdue-bg": "rgba(255,107,0,.12)",
      "--r-card": "4px",
      "--r-btn": "4px",
      "--r-chip": "2px",
      "--shadow": "none",
      "--shadow-btn": "none",
      "--blur": "none",
      "--frame": "#2C2C2C",
      "--display": "var(--font-geist-sans)",
      "--body": "var(--font-geist-sans)",
      "--mono": "var(--font-geist-mono)",
      "--meta-font": "var(--font-geist-mono)",
      "--label-font": "var(--font-geist-mono)",
      "--label-transform": "uppercase",
      "--label-tracking": "0.1em",
      "--display-weight": "600",
      "--display-tracking": "-0.04em",
    },
    swatches: [
      { name: "Black", hex: "#111111" },
      { name: "Graphite", hex: "#191919" },
      { name: "Iron", hex: "#2C2C2C" },
      { name: "Ash", hex: "#8F8F8F" },
      { name: "Bone", hex: "#EDEDED" },
      { name: "Safety orange", hex: "#FF6B00" },
    ],
    markColors: { bg: ["#EDEDED", "#FF6B00"], primary: ["#111111", "#111111"], icon: ["#EDEDED", "#FF6B00"] },
    iconBg: "#111111",
    wordmark: { text: "DISPATCH", style: { fontFamily: "var(--font-geist-mono)", fontWeight: 500, letterSpacing: "0.2em" }, scale: 0.78 },
  },
];

/* ---------- shared styles (all read the option's CSS variables) ---------- */

const card: CSSProperties = {
  background: "var(--surface)",
  border: "var(--bw) solid var(--border)",
  borderRadius: "var(--r-card)",
  boxShadow: "var(--shadow)",
  backdropFilter: "var(--blur)",
  WebkitBackdropFilter: "var(--blur)",
};

const label = {
  fontFamily: "var(--label-font)",
  textTransform: "var(--label-transform)",
  letterSpacing: "var(--label-tracking)",
  color: "var(--muted)",
  fontSize: 10.5,
  fontWeight: 600,
} as CSSProperties;

const display = {
  fontFamily: "var(--display)",
  fontWeight: "var(--display-weight)",
  letterSpacing: "var(--display-tracking)",
} as CSSProperties;

const primaryBtn: CSSProperties = {
  background: "var(--primary)",
  color: "var(--on-primary)",
  borderRadius: "var(--r-btn)",
  boxShadow: "var(--shadow-btn)",
  border: "var(--btn-border)",
};

const secondaryBtn: CSSProperties = {
  background: "var(--surface)",
  color: "var(--text)",
  borderRadius: "var(--r-btn)",
  border: "var(--bw) solid var(--border)",
};

// Animations for the mock screens. They stop if the phone is set to reduce motion.
const ANIMATIONS = `
.looks-halo { position: absolute; inset: -16px; border-radius: 9999px; animation: looks-halo 2.4s ease-in-out infinite; }
.looks-dot { width: 7px; height: 7px; border-radius: 9999px; animation: looks-blink 1.2s ease-in-out infinite; }
.looks-bar { width: 3px; border-radius: 3px; animation: looks-wave 1.1s ease-in-out infinite; }
@keyframes looks-halo { 0%, 100% { transform: scale(0.92); opacity: 0.1; } 50% { transform: scale(1.06); opacity: 0.24; } }
@keyframes looks-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes looks-wave { 0%, 100% { transform: scaleY(0.45); } 50% { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .looks-halo, .looks-dot, .looks-bar { animation: none; } }
`;

/* ---------- logos ---------- */

// Voice level bars that turn into a send arrow.
function SignalMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill={color} aria-hidden>
      <rect x="5" y="19" width="5" height="10" rx="2.5" />
      <rect x="13" y="14" width="5" height="20" rx="2.5" />
      <rect x="21" y="9" width="5" height="30" rx="2.5" />
      <path d="M31 12l12 12-12 12" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A postmark: double ring, serif D, and wavy cancellation lines.
function PaperMark({ size, ink, accent }: { size: number; ink: string; accent: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle cx="19" cy="24" r="15" fill="none" stroke={ink} strokeWidth="2.2" />
      <circle cx="19" cy="24" r="11.5" fill="none" stroke={ink} strokeWidth="1" />
      <text x="19" y="29.8" textAnchor="middle" fontSize="17" fill={ink} style={{ fontFamily: "var(--font-instrument-serif)" }}>
        D
      </text>
      <g fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round">
        <path d="M29 17c2.5-2 5-2 7.5 0s5 2 7.5 0" />
        <path d="M29 24c2.5-2 5-2 7.5 0s5 2 7.5 0" />
        <path d="M29 31c2.5-2 5-2 7.5 0s5 2 7.5 0" />
      </g>
    </svg>
  );
}

// A speech bubble shaped like a D, with a send arrow inside.
function PulseMark({ size, bubble, arrow }: { size: number; bubble: string; arrow: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path d="M7 6h17a17 17 0 0 1 0 34H15l-8 7V6z" fill={bubble} stroke={bubble} strokeWidth="3" strokeLinejoin="round" />
      <path d="M15 23h15m-6-7 7 7-7 7" fill="none" stroke={arrow} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A geometric D with a recording light.
function GraphiteMark({ size, color, dot }: { size: number; color: string; dot: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path d="M10 8h12a16 16 0 0 1 0 32H10z" fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="23" cy="24" r="5" fill={dot} />
    </svg>
  );
}

function Mark({ look, size, tone = "bg" }: { look: Look; size: number; tone?: Tone }) {
  const [a, b] = look.markColors[tone];
  switch (look.id) {
    case "signal":
      return <SignalMark size={size} color={a} />;
    case "aurora":
      return <AuroraMark size={size} fill={a} wave={b} />;
    case "paper":
      return <PaperMark size={size} ink={a} accent={b} />;
    case "pulse":
      return <PulseMark size={size} bubble={a} arrow={b} />;
    case "graphite":
      return <GraphiteMark size={size} color={a} dot={b} />;
  }
}

function Wordmark({ look, size }: { look: Look; size: number }) {
  const w = look.wordmark;
  return (
    <span className="leading-none" style={{ ...w.style, fontSize: size * (w.scale ?? 1) }}>
      {w.text}
      {w.dot && <span style={{ color: w.dot }}>.</span>}
    </span>
  );
}

function AppIcon({ look, size }: { look: Look; size: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        background: look.iconBg,
        boxShadow: "0 1px 3px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.08)",
      }}
    >
      <Mark look={look} size={size * 0.64} tone="icon" />
    </span>
  );
}

/* ---------- small icons for the mock screens ---------- */

type IconProps = { size?: number };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function MicIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
function StopIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="3" />
    </svg>
  );
}
function ListIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  );
}
function SlidersIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M4 7h9m4 0h3M4 17h3m4 0h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}
function CheckIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={3} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
function CopyIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}
function ChevronLeft({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
function ArrowRight({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* ---------- mock phone and its parts ---------- */

function Phone({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="shrink-0 snap-center" style={{ width: 272 }}>
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          height: 560,
          borderRadius: 40,
          background: "var(--bg)",
          border: "1px solid var(--frame)",
          boxShadow: "0 30px 60px -30px rgba(0,0,0,.45)",
          color: "var(--text)",
        }}
      >
        <span className="absolute left-1/2 top-2.5 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
        <StatusBar />
        {children}
      </div>
      <figcaption className="mt-2.5 text-center text-xs" style={{ color: "var(--muted)" }}>
        {title}
      </figcaption>
    </figure>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-7 pt-3.5 pb-1 text-[12px] font-semibold" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <span>9:41</span>
      <span className="flex items-center gap-1" aria-hidden>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
          <rect x="0" y="6" width="3" height="4" rx="1" />
          <rect x="4.5" y="4" width="3" height="6" rx="1" />
          <rect x="9" y="2" width="3" height="8" rx="1" />
          <rect x="13" y="0" width="3" height="10" rx="1" opacity=".35" />
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
          <rect x=".5" y=".5" width="18" height="10" rx="3" stroke="currentColor" opacity=".5" />
          <rect x="2" y="2" width="12" height="7" rx="1.5" fill="currentColor" />
          <rect x="20" y="3.5" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".5" />
        </svg>
      </span>
    </div>
  );
}

function TabBar({ active }: { active: "speak" | "actions" }) {
  const tabs = [
    { id: "speak", name: "Speak", icon: <MicIcon /> },
    { id: "actions", name: "Actions", icon: <ListIcon /> },
    { id: "settings", name: "Settings", icon: <SlidersIcon /> },
  ];
  return (
    <nav
      className="mt-auto flex justify-around px-4 pt-2 pb-6"
      style={{ borderTop: "var(--bw) solid var(--hair)", background: "var(--surface)", backdropFilter: "var(--blur)", WebkitBackdropFilter: "var(--blur)" }}
    >
      {tabs.map((t) => (
        <span
          key={t.id}
          className="flex flex-col items-center gap-0.5 text-[10px] font-semibold"
          style={{ color: t.id === active ? "var(--accent)" : "var(--muted)" }}
        >
          {t.icon}
          {t.name}
        </span>
      ))}
    </nav>
  );
}

function RecordButton({ size, listening }: { size: number; listening?: boolean }) {
  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }}>
      <span className="looks-halo" style={{ background: "var(--accent)" }} aria-hidden />
      <span
        className="relative grid place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          background: "var(--record)",
          color: "var(--on-record)",
          boxShadow: "var(--shadow-btn)",
          border: "var(--btn-border)",
        }}
      >
        {listening ? <StopIcon size={size * 0.32} /> : <MicIcon size={size * 0.36} />}
      </span>
    </span>
  );
}

function Stat({ value, name, alert }: { value: string; name: string; alert?: boolean }) {
  return (
    <div className="px-3 py-2.5" style={{ ...card, ...(alert ? { background: "var(--overdue-bg)" } : {}) }}>
      <div className="text-[24px] leading-none" style={{ ...display, color: alert ? "var(--overdue)" : "var(--text)" }}>
        {value}
      </div>
      <div className="mt-1.5" style={{ ...label, color: alert ? "var(--overdue)" : "var(--muted)" }}>
        {name}
      </div>
    </div>
  );
}

function Chip({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className="px-3 py-1.5 text-[12px] font-semibold"
      style={{
        borderRadius: "var(--r-chip)",
        background: active ? "var(--primary)" : "transparent",
        color: active ? "var(--on-primary)" : "var(--text)",
        border: active ? "var(--btn-border)" : "var(--bw) solid var(--border)",
      }}
    >
      {children}
    </span>
  );
}

/* ---------- the four mock screens ---------- */

function HomeScreen({ look }: { look: Look }) {
  return (
    <>
      <div className="flex items-center justify-between px-5 pt-3">
        <span className="flex items-center gap-2">
          <Mark look={look} size={26} />
          <Wordmark look={look} size={19} />
        </span>
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold"
          style={{ background: "var(--surface2)", border: "var(--bw) solid var(--border)" }}
        >
          K
        </span>
      </div>
      <div className="px-5 pt-7">
        <p style={label}>Sunday 22 November</p>
        <h3 className="mt-2 text-[28px] leading-[1.08]" style={display}>
          Morning, Killian.
        </h3>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--muted)" }}>
          What needs doing?
        </p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <RecordButton size={116} />
        <p className="mt-6 text-sm" style={{ color: "var(--muted)" }}>
          Tap and speak
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 px-5 pb-4">
        <Stat value="4" name="Open" />
        <Stat value="1" name="Overdue" alert />
      </div>
      <TabBar active="speak" />
    </>
  );
}

const WAVE = [8, 14, 22, 30, 18, 36, 44, 28, 16, 24, 40, 48, 34, 20, 12, 26, 38, 30, 18, 10, 22, 34, 26, 14, 8, 16, 12, 6];

function ListeningScreen({ look }: { look: Look }) {
  return (
    <>
      <div className="flex items-center justify-between px-5 pt-3">
        <span
          className="flex items-center gap-2 px-3 py-1 text-xs font-semibold"
          style={{ background: "var(--chip)", color: "var(--on-chip)", borderRadius: "var(--r-chip)", border: "var(--btn-border)" }}
        >
          <span className="looks-dot" style={{ background: "var(--accent)" }} />
          Listening
        </span>
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Cancel
        </span>
      </div>
      <p className="px-5 pt-5 text-[17px] font-medium leading-snug">
        Priya, can you get the Q3 numbers ready for the board pack by Wednesday?{" "}
        <span style={{ color: "var(--muted)" }}>Tom should see it too…</span>
      </p>
      <div className="flex h-14 items-center justify-center gap-[3px] px-5 pt-3" aria-hidden>
        {WAVE.map((h, i) => (
          <span key={i} className="looks-bar" style={{ height: h, background: "var(--accent)", animationDelay: `${(i % 7) * -0.15}s` }} />
        ))}
      </div>
      <div className="mx-4 mt-auto p-3.5" style={card}>
        <span className="flex items-center gap-2">
          <Mark look={look} size={18} />
          <span style={label}>Dispatch</span>
        </span>
        <p className="mt-2 text-[15px] font-semibold leading-snug">Anyone to copy in on Priya&apos;s email?</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip active>Tom (suggested)</Chip>
          <Chip>No one</Chip>
          <Chip>Someone else</Chip>
        </div>
      </div>
      <div className="flex justify-center pt-5 pb-7">
        <RecordButton size={60} listening />
      </div>
    </>
  );
}

function DraftScreen() {
  const row = (k: string, v: ReactNode) => (
    <div className="flex items-center gap-2 py-1.5 text-[13px]" style={{ borderBottom: "1px solid var(--hair)" }}>
      <span className="w-7" style={label}>
        {k}
      </span>
      {v}
    </div>
  );
  const field = (k: string, v: string) => (
    <p>
      <span className="font-semibold" style={{ color: "var(--accent)" }}>
        {k}:
      </span>{" "}
      {v}
    </p>
  );
  const copy = (name: string, done?: boolean) => (
    <span
      className="flex items-center justify-center gap-1 py-2 text-[11.5px] font-semibold"
      style={{
        borderRadius: "var(--r-btn)",
        border: "var(--bw) solid var(--border)",
        background: done ? "var(--surface2)" : "var(--surface)",
      }}
    >
      <span style={{ color: done ? "var(--accent)" : "var(--muted)" }}>{done ? <CheckIcon size={12} /> : <CopyIcon size={12} />}</span>
      {name}
    </span>
  );
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="flex items-center text-sm" style={{ color: "var(--muted)" }}>
          <ChevronLeft />
          Back
        </span>
        <span style={label}>Email 1 of 2</span>
        <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
          Read back
        </span>
      </div>
      {/* The email shrinks (like a scrolling view) so the buttons below always stay on screen. */}
      <div className="mx-4 mt-3 min-h-0 flex-1 overflow-hidden p-3.5" style={card}>
        {row(
          "To",
          <span className="flex items-center gap-1.5 font-semibold">
            Priya
            <span className="px-1.5 py-px text-[10px]" style={{ background: "var(--chip)", color: "var(--on-chip)", borderRadius: "var(--r-chip)" }}>
              EA
            </span>
          </span>
        )}
        {row("CC", <span className="font-semibold">Tom</span>)}
        <h3 className="mt-2.5 text-[16px] leading-snug" style={display}>
          Q3 board numbers – by Wed 25 Nov
        </h3>
        <div className="mt-2 space-y-1 text-[12px] leading-snug">
          <p>Hi Priya,</p>
          <p>Can you own getting the Q3 numbers ready for the board pack?</p>
          {field("Context", "The board wants Q3 against forecast.")}
          {field("Action", "Pull revenue and costs; flag variances over 5%.")}
          {field("Outcome", "A one-page summary for the pack.")}
          {field("Deadline", "17:30, Wed 25 Nov")}
          <p className="pt-0.5">Thanks, Killian</p>
        </div>
      </div>
      <div className="mx-4 mt-2.5 grid grid-cols-4 gap-1.5">
        {copy("To", true)}
        {copy("CC", true)}
        {copy("Subject")}
        {copy("Body")}
      </div>
      <div className="mx-4 mt-2.5 mb-6">
        <span className="flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold" style={primaryBtn}>
          Next: Tom&apos;s email <ArrowRight />
        </span>
      </div>
    </>
  );
}

const ACTIONS = [
  { title: "Venue shortlist", who: "Tom", due: "Fri 20 Nov", overdue: true },
  { title: "Q3 board numbers", who: "Priya", due: "Wed 25 Nov" },
  { title: "Supplier review", who: "Tom", due: "Fri 27 Nov" },
  { title: "December diary", who: "Priya", due: "Mon 30 Nov" },
];

function ActionsScreen() {
  return (
    <>
      <div className="flex items-end justify-between px-5 pt-4">
        <h3 className="text-[30px] leading-none" style={display}>
          Actions
        </h3>
        <span style={label}>4 open</span>
      </div>
      <div
        className="mx-5 mt-4 grid grid-cols-2 p-1 text-xs font-semibold"
        style={{ background: "var(--surface2)", borderRadius: "var(--r-btn)", border: "var(--bw) solid var(--border)" }}
      >
        <span className="py-1.5 text-center" style={{ background: "var(--surface)", borderRadius: "var(--r-btn)", boxShadow: "0 1px 2px rgba(0,0,0,.12)" }}>
          Open
        </span>
        <span className="py-1.5 text-center" style={{ color: "var(--muted)" }}>
          Completed
        </span>
      </div>
      <div className="mx-5 mt-3 flex gap-4 text-xs">
        <span className="font-semibold">By deadline</span>
        <span style={{ color: "var(--muted)" }}>By person</span>
      </div>
      <div className="mx-4 mt-3 space-y-2">
        {ACTIONS.map((a) => (
          <div key={a.title} className="flex items-center gap-3 px-3 py-2.5" style={card}>
            <span className="h-5 w-5 shrink-0 rounded-full" style={{ border: "1.5px solid var(--muted)" }} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-[14px] font-semibold">{a.title}</span>
                {a.overdue && (
                  <span
                    className="shrink-0 px-1.5 py-px text-[9.5px] font-bold uppercase"
                    style={{ background: "var(--overdue-bg)", color: "var(--overdue)", borderRadius: "var(--r-chip)" }}
                  >
                    Overdue
                  </span>
                )}
              </span>
              <span
                className="block truncate whitespace-nowrap text-[11.5px]"
                style={{ fontFamily: "var(--meta-font)", color: a.overdue ? "var(--overdue)" : "var(--muted)" }}
              >
                {a.who} · {a.due}
              </span>
            </span>
          </div>
        ))}
      </div>
      <TabBar active="actions" />
    </>
  );
}

/* ---------- page ---------- */

type Saved = { current: LookId; fav: LookId | null; notes: Partial<Record<LookId, string>> };
const STORAGE_KEY = "dispatch-looks-v1";

function loadSaved(): Saved {
  let saved: Saved = { current: "signal", fav: null, notes: {} };
  try {
    const s = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Saved> | null;
    if (s && LOOKS.some((l) => l.id === s.current)) saved = { current: s.current!, fav: s.fav ?? null, notes: s.notes ?? {} };
  } catch {
    /* storage unavailable: start from the defaults */
  }
  // A link like /looks?look=paper opens that option directly.
  const asked = new URLSearchParams(window.location.search).get("look");
  const match = LOOKS.find((l) => l.id === asked);
  return match ? { ...saved, current: match.id } : saved;
}

const noopSubscribe = () => () => {};

export function Looks() {
  // Render only in the browser, so your saved choice never mismatches the server render.
  const inBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return inBrowser ? <LooksBody /> : <p className="p-6">Loading…</p>;
}

function LooksBody() {
  const [saved, setSaved] = useState<Saved>(loadSaved);
  const [copied, setCopied] = useState(false);
  const index = LOOKS.findIndex((l) => l.id === saved.current);
  const look = LOOKS[index];
  const prev = LOOKS[(index + LOOKS.length - 1) % LOOKS.length];
  const next = LOOKS[(index + 1) % LOOKS.length];

  function update(patch: Partial<Saved>) {
    setSaved((s) => {
      const n = { ...s, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
      } catch {
        /* storage unavailable: choices just won't survive a reload */
      }
      return n;
    });
  }

  function go(id: LookId, toTop: boolean) {
    update({ current: id });
    setCopied(false);
    if (toTop) window.scrollTo({ top: 0 });
  }

  // Match the strip behind the iPhone status bar, and form controls, to the option on screen.
  useEffect(() => {
    const body = document.body.style;
    const root = document.documentElement.style;
    const before = { background: body.background, scheme: root.colorScheme };
    body.background = look.vars["--bg-solid"];
    root.colorScheme = look.dark ? "dark" : "light";
    return () => {
      body.background = before.background;
      root.colorScheme = before.scheme;
    };
  }, [look]);

  async function copyFeedback() {
    const favIndex = LOOKS.findIndex((l) => l.id === saved.fav);
    const text = [
      "Dispatch – look & feel feedback",
      `Favourite: ${favIndex >= 0 ? `${favIndex + 1}. ${LOOKS[favIndex].name}` : "none picked"}`,
      "",
      ...LOOKS.map((l, i) => `${i + 1}. ${l.name}${saved.fav === l.id ? " (favourite)" : ""}: ${saved.notes[l.id]?.trim() || "(no notes)"}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      alert("Couldn't copy automatically. Your notes are saved on this device, so you can type them to Claude instead.");
    }
  }

  const isFav = saved.fav === look.id;
  const sectionTitle = (title: string, hint?: string) => (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[26px] leading-none" style={display}>
        {title}
      </h2>
      {hint && <span style={label}>{hint}</span>}
    </div>
  );

  return (
    <div
      className="flex min-h-full flex-1 flex-col pb-16"
      style={{ ...(look.vars as CSSProperties), background: "var(--page)", color: "var(--text)", fontFamily: "var(--body)" }}
    >
      <style>{ANIMATIONS}</style>

      {/* Option switcher */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: "color-mix(in srgb, var(--bg-solid) 82%, transparent)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--hair)",
        }}
      >
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-2.5">
          <Link
            href="/admin"
            className="flex shrink-0 items-center px-3.5 py-1.5 text-sm font-semibold"
            style={{ borderRadius: 999, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--hair)" }}
          >
            ← Admin
          </Link>
          <Link
            href="/"
            className="flex shrink-0 items-center px-3.5 py-1.5 text-sm font-semibold"
            style={{ borderRadius: 999, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--hair)" }}
          >
            Home
          </Link>
          {LOOKS.map((l, i) => {
            const on = l.id === look.id;
            return (
              <button
                key={l.id}
                onClick={() => go(l.id, false)}
                aria-pressed={on}
                className="flex shrink-0 items-center gap-2 py-1.5 pr-3.5 pl-1.5 text-sm font-semibold"
                style={{
                  borderRadius: 999,
                  background: on ? "var(--primary)" : "var(--surface)",
                  color: on ? "var(--on-primary)" : "var(--text)",
                  border: on ? "var(--btn-border)" : "1px solid var(--hair)",
                }}
              >
                <AppIcon look={l} size={24} />
                {i + 1}. {l.name}
                {saved.fav === l.id && <span aria-label="favourite">★</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Intro */}
      <section className="mx-auto w-full max-w-5xl px-4 pt-8">
        <p className="text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Five directions for Dispatch&apos;s logo, colours and type. Tap through them, swipe the screens, pick a favourite
          and add notes. Then tap <b>Copy my feedback</b> at the bottom and paste it to Claude.
        </p>
        <div className="mt-7 flex items-center gap-4">
          <AppIcon look={look} size={76} />
          <div>
            <p style={label}>
              Option {index + 1} of {LOOKS.length}
            </p>
            <h1 className="mt-1.5 text-[42px] leading-none" style={display}>
              {look.name}
            </h1>
          </div>
        </div>
        <p className="mt-6 max-w-xl text-[24px] leading-snug" style={display}>
          {look.tagline}
        </p>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
          {look.vibe}
        </p>
        <button onClick={() => update({ fav: isFav ? null : look.id })} className="mt-5 px-4 py-2.5 text-sm font-semibold" style={isFav ? secondaryBtn : primaryBtn}>
          {isFav ? "★ Your favourite (tap to undo)" : "☆ Make this my favourite"}
        </button>
      </section>

      {/* Screens */}
      <section className="mt-12">
        <div className="mx-auto w-full max-w-5xl px-4">{sectionTitle("Screens", "Swipe sideways")}</div>
        <div className="mx-auto mt-5 w-full max-w-[1180px] snap-x snap-mandatory overflow-x-auto">
          <div className="flex w-max gap-5 px-4 pb-4">
            <Phone title="Home">
              <HomeScreen look={look} />
            </Phone>
            <Phone title="Listening, hands-free">
              <ListeningScreen look={look} />
            </Phone>
            <Phone title="Draft email">
              <DraftScreen />
            </Phone>
            <Phone title="Open actions">
              <ActionsScreen />
            </Phone>
          </div>
        </div>
      </section>

      {/* Logo */}
      <section className="mx-auto mt-12 w-full max-w-5xl px-4">
        {sectionTitle("Logo")}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="flex min-h-[150px] flex-col justify-between p-5" style={card}>
            <span className="flex items-center gap-3">
              <Mark look={look} size={44} />
              <Wordmark look={look} size={30} />
            </span>
            <span style={label}>On the app background</span>
          </div>
          <div className="flex min-h-[150px] flex-col justify-between p-5" style={{ ...primaryBtn, borderRadius: "var(--r-card)" }}>
            <span className="flex items-center gap-3">
              <Mark look={look} size={44} tone="primary" />
              <Wordmark look={look} size={30} />
            </span>
            <span style={{ ...label, color: "inherit", opacity: 0.75 }}>On the main colour</span>
          </div>
          <div
            className="flex min-h-[150px] flex-col justify-between p-5"
            style={{ borderRadius: "var(--r-card)", background: "linear-gradient(160deg, #3B4A6B 0%, #8A6F8F 55%, #D9A47E 100%)", color: "#fff" }}
          >
            <span className="flex items-start gap-4">
              {[0, 1].map((i) => (
                <span key={i} className="flex flex-col items-center gap-1">
                  <span className="h-14 w-14 rounded-[13px]" style={{ background: "rgba(255,255,255,.22)" }} />
                  <span className="text-[11px] opacity-80">App</span>
                </span>
              ))}
              <span className="flex flex-col items-center gap-1">
                <AppIcon look={look} size={56} />
                <span className="text-[11px]" style={{ textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>
                  Dispatch
                </span>
              </span>
            </span>
            <span className="text-[10.5px] font-semibold tracking-wider uppercase opacity-80">On your Home Screen</span>
          </div>
        </div>
      </section>

      {/* Colours */}
      <section className="mx-auto mt-12 w-full max-w-5xl px-4">
        {sectionTitle("Colours")}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {look.swatches.map((s) => (
            <div key={s.hex} className="overflow-hidden" style={{ ...card, boxShadow: "none" }}>
              <div className="h-16" style={{ background: s.hex, borderBottom: "1px solid var(--hair)" }} />
              <div className="px-2.5 py-2">
                <p className="text-[13px] font-semibold">{s.name}</p>
                <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--muted)" }}>
                  {s.hex}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Type */}
      <section className="mx-auto mt-12 w-full max-w-5xl px-4">
        {sectionTitle("Type")}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="p-5" style={card}>
            <p style={label}>Headings · {look.fonts.display}</p>
            <p className="mt-3 text-[72px] leading-none" style={display}>
              Aa
            </p>
            <p className="mt-4 text-[30px] leading-tight" style={display}>
              Who should own this?
            </p>
          </div>
          <div className="p-5" style={card}>
            <p style={label}>Text · {look.fonts.body}</p>
            <p className="mt-3 text-[16px] leading-relaxed">
              Can you own getting the Q3 numbers ready for the board pack? A one-page summary I can drop straight into the
              pack would be perfect. Thanks, Killian
            </p>
            <p className="mt-4 text-[13px]" style={{ fontFamily: "var(--mono)", color: "var(--muted)" }}>
              17:30 · Wed 25 Nov · 4 open · 1 overdue
            </p>
          </div>
        </div>
      </section>

      {/* Notes and feedback */}
      <section className="mx-auto mt-12 w-full max-w-5xl px-4">
        {sectionTitle(`Your notes on ${look.name}`)}
        <textarea
          value={saved.notes[look.id] ?? ""}
          onChange={(e) => {
            update({ notes: { ...saved.notes, [look.id]: e.target.value } });
            setCopied(false);
          }}
          placeholder="What do you like or dislike? For example: love the logo, colours too dark, fonts feel right."
          className="mt-4 block w-full p-3 text-[16px] leading-relaxed"
          style={{ ...card, boxShadow: "none", minHeight: 110, color: "var(--text)", fontFamily: "var(--body)" }}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => go(prev.id, true)} className="px-4 py-2.5 text-sm font-semibold" style={secondaryBtn}>
            ← {prev.name}
          </button>
          <button onClick={() => go(next.id, true)} className="px-4 py-2.5 text-sm font-semibold" style={secondaryBtn}>
            {next.name} →
          </button>
          <button onClick={copyFeedback} className="px-4 py-2.5 text-sm font-semibold" style={primaryBtn}>
            {copied ? "Copied ✓" : "Copy my feedback"}
          </button>
        </div>
        <p className="mt-3 text-[13px]" style={{ color: "var(--muted)" }}>
          Favourite: {saved.fav ? LOOKS.find((l) => l.id === saved.fav)?.name : "none picked yet"}. Notes are saved on this
          device.
        </p>
        <p className="mt-8 text-[13px]">
          <Link href="/" style={{ color: "var(--accent)" }} className="font-semibold">
            ← Back to Dispatch
          </Link>
        </p>
      </section>
    </div>
  );
}
