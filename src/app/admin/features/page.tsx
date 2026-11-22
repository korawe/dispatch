import type { Metadata } from "next";
import Link from "next/link";
import { ClientOnly } from "@/components/client-only";
import { TopBar } from "@/components/top-bar";
import { FeatureList } from "./feature-list";
import { FEATURES } from "./features";

export const metadata: Metadata = { title: "Future features · Dispatch" };

export default function FeaturesPage() {
  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
      <TopBar />
      <div className="space-y-2">
        <Link href="/admin" className="text-sm font-semibold text-dim underline">
          ← Admin
        </Link>
        <h1 className="font-display text-[34px] leading-none font-extrabold tracking-tight">Future features</h1>
        <p className="text-[15px] leading-relaxed text-dim">
          Ideas and capabilities to add later. Add your own on your iPhone, or ask Claude to add or remove items.
        </p>
      </div>
      <ClientOnly fallback={<p className="text-dim">Loading…</p>}>
        <FeatureList shared={FEATURES} />
      </ClientOnly>
    </main>
  );
}
