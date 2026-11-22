import type { Metadata } from "next";
import type { ReactNode } from "react";
import { bricolage, outfit } from "../fonts";

export const metadata: Metadata = {
  title: "Phase 0 tests · Dispatch",
};

// The test page uses the chosen look: Pulse (fonts, colours, outlines; see globals.css) with the Aurora icon.
export default function SpikeLayout({ children }: { children: ReactNode }) {
  return <div className={`${bricolage.variable} ${outfit.variable} pulse flex flex-1 flex-col`}>{children}</div>;
}
