import Link from "next/link";
import { AppIcon } from "@/components/brand";
import { NewNoteButton } from "./new-note-button";

// The home page, in the Pulse look (spec decision 31). New note is the main thing to do; adding delegates comes
// second; Admin is tucked away at the bottom.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between gap-10 px-6 py-8">
      <header className="flex w-full flex-col items-center gap-2 text-center">
        <span className="flex items-center gap-2.5">
          <AppIcon size={40} outlined />
          <span className="font-display text-[30px] leading-none font-extrabold tracking-tight">dispatch</span>
        </span>
        <p className="text-[15px] text-dim">Turn a quick voice note into clear delegation emails.</p>
      </header>

      <NewNoteButton />

      <div className="flex w-full flex-col items-center gap-5">
        <Link href="/people" className="btn-secondary w-full">
          ＋ Add delegates
        </Link>
        <Link href="/admin" className="text-sm text-dim underline">
          Admin
        </Link>
      </div>
    </main>
  );
}
