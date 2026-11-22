import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { FEATURES } from "./features";

export const metadata: Metadata = { title: "Future features · Dispatch" };

export default function FeaturesPage() {
  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
      <TopBar
        right={
          <Link href="/admin" className="btn-secondary">
            ← Admin
          </Link>
        }
      />
      <div className="space-y-2">
        <h1 className="font-display text-[34px] leading-none font-extrabold tracking-tight">Future features</h1>
        <p className="text-[15px] leading-relaxed text-dim">
          Ideas and capabilities to add later. Ask Claude to add or remove items, and it updates this list.
        </p>
      </div>
      <ul className="space-y-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="space-y-2 rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
            <h2 className="font-display text-[20px] leading-tight font-extrabold tracking-tight">{f.title}</h2>
            <p className="flex flex-wrap items-center gap-2 text-sm text-dim">
              <span className="rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-xs font-bold text-ink">{f.status}</span>
              Added {f.added}
            </p>
            <p className="text-[15px] leading-relaxed">{f.detail}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
