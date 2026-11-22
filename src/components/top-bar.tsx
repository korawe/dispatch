import Link from "next/link";
import type { ReactNode } from "react";
import { AppIcon } from "./brand";

/** The Dispatch logo (back to the home page), with an optional control on the right. */
export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link href="/" className="flex items-center gap-2.5" aria-label="Dispatch home">
        <AppIcon size={34} outlined />
        <span className="font-display text-[21px] leading-none font-extrabold tracking-tight">dispatch</span>
      </Link>
      {right}
    </header>
  );
}
