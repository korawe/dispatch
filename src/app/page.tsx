import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <Image src="/icon-192.png" alt="" width={96} height={96} className="rounded-2xl" priority />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Dispatch</h1>
        <p className="opacity-80">Turn a quick voice note into clear delegation emails.</p>
      </div>
      <p className="text-sm opacity-70">Phase 0: checking what your iPhone and desktop can do before we build.</p>
      <Link href="/spike" className="btn-primary">
        Open the Phase 0 tests
      </Link>
    </main>
  );
}
