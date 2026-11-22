import Link from "next/link";
import { AppIcon } from "@/components/brand";

// Landing page, in the Pulse look like the rest of the app (spec decision 31).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-10">
      <div className="flex flex-col items-center text-center">
        <AppIcon size={104} outlined />
        <h1 className="mt-6 font-display text-[46px] leading-none font-extrabold tracking-tight">dispatch</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-dim">Turn a quick voice note into clear delegation emails.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/note" className="btn-primary py-4 text-lg">
          ＋ New note
        </Link>
        <Link href="/people" className="btn-secondary">
          People
        </Link>
      </div>

      <p className="text-center text-sm text-dim">
        <Link href="/admin" className="underline">
          Admin
        </Link>
      </p>
    </main>
  );
}
