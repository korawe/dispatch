import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Phase 0 tests · Dispatch",
};

// The Pulse look comes from the root layout, like every other page.
export default function SpikeLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
