import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { FEATURES } from "./features/features";

export const metadata: Metadata = { title: "Admin · Dispatch" };

const LINKS = [
  { href: "/spike", title: "Phase 0 tests", detail: "The iPhone and desktop checklist: mic, speech recognition, read-aloud, hands-free, notifications and more." },
  { href: "/looks", title: "Look & feel options", detail: "The five design directions. Pulse, with the Aurora speech-bubble logo, was chosen (decision 31)." },
  { href: "/admin/features", title: "Future features", detail: `Ideas and capabilities to add later (${FEATURES.length} so far).` },
];

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
      <TopBar
        right={
          <Link href="/" className="btn-secondary">
            ← Home
          </Link>
        }
      />
      <h1 className="font-display text-[34px] leading-none font-extrabold tracking-tight">Admin</h1>
      <ul className="space-y-3">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center gap-3 rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-display text-[20px] leading-tight font-extrabold tracking-tight">{l.title}</span>
                <span className="block text-[15px] leading-relaxed text-dim">{l.detail}</span>
              </span>
              <span aria-hidden className="text-2xl font-bold">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
