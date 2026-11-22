import Link from "next/link";
import type { ReactNode } from "react";
import { AppIcon } from "./brand";

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10v9.5h11V10" />
    </svg>
  );
}

/** Back to the home page, from anywhere. A note in progress is saved, so nothing is lost. */
export function HomeButton() {
  return (
    <Link href="/" className="btn-secondary gap-1.5">
      <HomeIcon />
      Home
    </Link>
  );
}

/** The Dispatch logo (also back to the home page), anything extra, and the Home button. */
export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link href="/" className="flex items-center gap-2.5" aria-label="Dispatch home">
        <AppIcon size={34} outlined />
        <span className="font-display text-[21px] leading-none font-extrabold tracking-tight">dispatch</span>
      </Link>
      <div className="flex items-center gap-3">
        {right}
        <HomeButton />
      </div>
    </header>
  );
}
