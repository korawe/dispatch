"use client";

import Link from "next/link";
import { useNoteInProgress } from "@/lib/use-local";

function MicIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

/** The main thing to do: a big round button to start a note, or to carry on with one part-way through. */
export function NewNoteButton() {
  // The note is saved on the device, so this reads it in the browser (the server always says "New note"), and
  // stays up to date even when Next.js has kept the home page alive in the background.
  const inProgress = useNoteInProgress();
  return (
    <Link href="/note" className="group flex flex-col items-center gap-5 text-center">
      <span className="relative grid h-48 w-48 place-items-center">
        <span aria-hidden className="halo-pulse absolute inset-0 rounded-full bg-sun" />
        <span className="relative grid h-36 w-36 place-items-center rounded-full border-2 border-ink bg-cobalt text-sun shadow-[5px_5px_0_#0d1440] transition-transform group-active:translate-x-[3px] group-active:translate-y-[3px] group-active:shadow-[2px_2px_0_#0d1440]">
          <MicIcon />
        </span>
      </span>
      <span className="font-display text-[32px] leading-none font-extrabold tracking-tight">
        {inProgress ? "Continue your note" : "New note"}
      </span>
      <span className="text-[15px] text-dim">{inProgress ? "Pick up where you left off" : "Say who needs to do what, and by when"}</span>
    </Link>
  );
}
