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

      <section className="rounded-[18px] border-2 border-ink bg-white p-5 shadow-pop">
        <span className="inline-block rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-xs font-bold tracking-[0.06em] uppercase">
          Phase 0
        </span>
        <p className="mt-3 text-[15px] leading-relaxed">Checking what your iPhone and desktop can do before we build.</p>
        <div className="mt-5 flex flex-col gap-3">
          <Link href="/spike" className="btn-primary">
            Open the Phase 0 tests
          </Link>
          <Link href="/looks" className="btn-secondary">
            See the look &amp; feel options
          </Link>
        </div>
      </section>
    </main>
  );
}
