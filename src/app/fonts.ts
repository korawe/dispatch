import { Bricolage_Grotesque, Outfit } from "next/font/google";

// Dispatch's chosen type (the Pulse look): Bricolage Grotesque for headings, Outfit for text. Defined once
// here, so every page that uses them shares one copy.
export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
export const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
