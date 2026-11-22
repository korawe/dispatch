import Link from "next/link";
import { AppIcon } from "@/components/brand";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <AppIcon size={96} />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Dispatch</h1>
        <p className="opacity-80">Turn a quick voice note into clear delegation emails.</p>
      </div>
      <p className="text-sm opacity-70">Phase 0: checking what your iPhone and desktop can do before we build.</p>
      <div className="flex flex-col items-center gap-3">
        <Link href="/spike" className="btn-primary">
          Open the Phase 0 tests
        </Link>
        <Link href="/looks" className="btn-secondary">
          See the look &amp; feel options
        </Link>
      </div>
    </main>
  );
}
