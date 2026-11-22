import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, Instrument_Serif, Inter, Outfit, Plus_Jakarta_Sans, Sora, Space_Grotesk } from "next/font/google";
import { Looks } from "./looks";

// Look & feel options, kept apart from the Phase 0 tests (/spike). Each option's fonts are exposed as CSS
// variables here. With preload off, a phone only downloads the fonts of the option on screen.
// Geist and Geist Mono come from the root layout.

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap", preload: false });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta", display: "swap", preload: false });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
});
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap", preload: false });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Look & feel · Dispatch",
  description: "Five directions for Dispatch's logo, colours and type.",
};

export default function LooksPage() {
  const fontVars = [spaceGrotesk, inter, sora, plusJakarta, instrumentSerif, dmSans, bricolage, outfit]
    .map((f) => f.variable)
    .join(" ");
  return (
    <div className={`${fontVars} flex flex-1 flex-col`}>
      <Looks />
    </div>
  );
}
